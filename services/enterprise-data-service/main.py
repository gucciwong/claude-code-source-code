from __future__ import annotations

import hashlib
import time
from typing import Any

import os

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from enterprise_data.audit_logger import AuditLogger
from enterprise_data.context_assembler import DataContextAssembler
from enterprise_data.pii_masker import PiiMasker
from enterprise_data.registry import ConnectorRegistry

# ZTLA — Zero-Trust Local AI (Innovation #9)
from enterprise_data.zero_trust import ZeroTrustMonitor, ThreatLevel

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# === W3-T8: local-token authentication ====================================
# All routes in this service (except /health) require a valid local token.
# Shared module resolved via sys.path; for Docker, build-context fix in
# W3-T8b ensures services/_shared is COPYed into the image.
import sys as _sys
from pathlib import Path as _Path
_shared_parent = _Path(__file__).resolve().parents[1]
if str(_shared_parent) not in _sys.path:
    _sys.path.insert(0, str(_shared_parent))
from _shared.auth import verify_local_token  # noqa: E402

# W6-T17 + W6-T18: shared observability + structured logging.
from _shared.observability import setup_metrics  # noqa: E402
from _shared.logging import install as install_logging  # noqa: E402
# ==========================================================================
app = FastAPI(title="Enterprise Data Service", version="0.1.0")

# W6-T17 + T18: install JSON logging + request-id middleware + /metrics.
install_logging(app, "enterprise-data-service")
setup_metrics(app, service_name="enterprise-data-service")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:5175,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5175",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)

_registry = ConnectorRegistry()
_assembler = DataContextAssembler(_registry)
_pii_masker = PiiMasker()
_audit_logger = AuditLogger()


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class ConnectorCreateRequest(BaseModel):
    name: str
    type: str
    connectionString: str | None = None
    baseUrl: str | None = None
    headers: dict[str, str] = Field(default_factory=dict)
    allowedTables: list[str] = Field(default_factory=list)
    enabled: bool = True


class QueryRequest(BaseModel):
    params: dict[str, Any] = Field(default_factory=dict)


class ContextRequest(BaseModel):
    prompt: str
    connector_ids: list[str]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@limiter.limit("60/minute")
@app.post("/connectors", status_code=201)
def register_connector(
    request: Request,
    body: ConnectorCreateRequest,
    _token: str = Depends(verify_local_token),
) -> dict:
    config = body.model_dump()
    return _registry.register(config)


@limiter.limit("60/minute")
@app.get("/connectors")
def list_connectors(
    request: Request,
    _token: str = Depends(verify_local_token),
) -> list[dict]:
    return _registry.list_all()


@limiter.limit("60/minute")
@app.delete("/connectors/{connector_id}", status_code=204)
def delete_connector(
    request: Request,
    connector_id: str,
    _token: str = Depends(verify_local_token),
):
    removed = _registry.remove(connector_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Connector not found")
    return Response(status_code=204)


@limiter.limit("60/minute")
@app.post("/connectors/{connector_id}/query")
def query_connector(
    request: Request,
    connector_id: str,
    body: QueryRequest,
    _token: str = Depends(verify_local_token),
) -> dict:
    connector = _registry.build_connector(connector_id)
    if connector is None:
        raise HTTPException(status_code=404, detail="Connector not found")

    start = time.monotonic()
    try:
        rows = connector.query(body.params)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    duration_ms = int((time.monotonic() - start) * 1000)

    masked_rows, total_pii = _pii_masker.mask_rows(rows)

    query_hash = hashlib.sha256(str(body.params).encode()).hexdigest()
    _audit_logger.log(
        user_id="system",
        connector_id=connector_id,
        query_hash=query_hash,
        rows_returned=len(masked_rows),
        pii_entities_masked=total_pii,
    )

    return {
        "rows": masked_rows,
        "masked_count": total_pii,
        "duration_ms": duration_ms,
    }


@limiter.limit("60/minute")
@app.get("/connectors/{connector_id}/schema")
def get_schema(
    request: Request,
    connector_id: str,
    _token: str = Depends(verify_local_token),
) -> dict:
    connector = _registry.build_connector(connector_id)
    if connector is None:
        raise HTTPException(status_code=404, detail="Connector not found")

    try:
        tables = connector.get_schema()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"tables": tables}


@limiter.limit("60/minute")
@app.post("/context")
def build_context(
    request: Request,
    body: ContextRequest,
    _token: str = Depends(verify_local_token),
) -> dict:
    xml_block = _assembler.build_context(body.prompt, body.connector_ids)
    return {"enterprise_context": xml_block}


# ---------------------------------------------------------------------------
# Audit log endpoints
# ---------------------------------------------------------------------------


@limiter.limit("60/minute")
@app.get("/audit-log")
def get_audit_log(
    request: Request,
    _token: str = Depends(verify_local_token),
) -> list[dict]:
    return _audit_logger.get_all()


@limiter.limit("60/minute")
@app.get("/audit-log/verify")
def verify_audit_log(
    request: Request,
    _token: str = Depends(verify_local_token),
) -> dict:
    return {"valid": _audit_logger.verify_chain()}


@limiter.limit("60/minute")
@app.get("/audit-log/export", response_class=PlainTextResponse)
def export_audit_log(
    request: Request,
    _token: str = Depends(verify_local_token),
) -> str:
    return _audit_logger.export_csv()


# ---------------------------------------------------------------------------
# ZTLA — Zero-Trust Local AI (Innovation #9)
# ---------------------------------------------------------------------------

_zt_monitor = ZeroTrustMonitor()


class ScanRequest(BaseModel):
    text: str = Field(..., description="Text to scan for exfiltration patterns")
    context: str = Field(default="inference_output", description="Scan context label")


class ScanResponse(BaseModel):
    threat_level: str
    threats: list[dict[str, Any]]
    safe: bool


class EgressCheckRequest(BaseModel):
    process_name: str = Field(default="sovereign-inference")
    allowed_hosts: list[str] = Field(default_factory=list)


class EgressCheckResponse(BaseModel):
    allowed: bool
    violations: list[dict[str, Any]]


class SandboxVerifyRequest(BaseModel):
    sandbox_id: str = Field(..., description="Sandbox identifier to verify")


class SandboxVerifyResponse(BaseModel):
    verified: bool
    checks: dict[str, bool]
    issues: list[str]


@limiter.limit("60/minute")
@app.post("/api/v1/ztla/scan")
def ztla_scan(
    request: Request,
    body: ScanRequest,
    _token: str = Depends(verify_local_token),
) -> dict:
    """Scan text for data exfiltration patterns."""
    scan = _zt_monitor.scan_output(body.text)
    result = scan.to_dict()
    result["safe"] = scan.threat_level in (ThreatLevel.SAFE, ThreatLevel.LOW)
    result["threat_level"] = scan.threat_level.label
    return result


@limiter.limit("60/minute")
@app.post("/api/v1/ztla/egress-check")
def ztla_egress_check(
    request: Request,
    body: EgressCheckRequest,
    _token: str = Depends(verify_local_token),
) -> dict:
    """Verify no unauthorized outbound connections."""
    result = _zt_monitor.check_network_egress()
    result["allowed"] = result.get("status") == "clean"
    return result


@limiter.limit("60/minute")
@app.post("/api/v1/ztla/sandbox-verify")
def ztla_sandbox_verify(
    request: Request,
    body: SandboxVerifyRequest,
    _token: str = Depends(verify_local_token),
) -> dict:
    """Verify sandbox isolation integrity."""
    result = _zt_monitor.verify_sandbox()
    result["verified"] = all([
        result.get("network_isolated", False),
        result.get("filesystem_restricted", False),
        result.get("memory_isolated", False),
        result.get("capabilities_restricted", False),
    ])
    result["checks"] = {
        "network_isolated": result.get("network_isolated", False),
        "filesystem_restricted": result.get("filesystem_restricted", False),
        "memory_isolated": result.get("memory_isolated", False),
        "capabilities_restricted": result.get("capabilities_restricted", False),
    }
    return result


@limiter.limit("60/minute")
@app.get("/api/v1/ztla/audit-log")
def ztla_audit_log(
    request: Request,
    _token: str = Depends(verify_local_token),
) -> dict:
    """Get zero-trust audit log entries."""
    return {"entries": _zt_monitor.get_audit_log()}


@limiter.limit("60/minute")
@app.get("/api/v1/ztla/security-report")
def ztla_security_report(
    request: Request,
    _token: str = Depends(verify_local_token),
) -> dict:
    """Get comprehensive security report."""
    return _zt_monitor.get_security_report()


@limiter.limit("60/minute")
@app.get("/health")
def health(request: Request) -> dict:
    return {
        "status": "ok",
        "connectors_loaded": len(_registry.list_all()),
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import os

    import uvicorn

    port = int(os.getenv("PORT", "8004"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
