from __future__ import annotations

import hashlib
import time
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from enterprise_data.audit_logger import AuditLogger
from enterprise_data.context_assembler import DataContextAssembler
from enterprise_data.pii_masker import PiiMasker
from enterprise_data.registry import ConnectorRegistry

app = FastAPI(title="Enterprise Data Service", version="0.1.0")

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


@app.post("/connectors", status_code=201)
def register_connector(body: ConnectorCreateRequest) -> dict:
    config = body.model_dump()
    return _registry.register(config)


@app.get("/connectors")
def list_connectors() -> list[dict]:
    return _registry.list_all()


@app.delete("/connectors/{connector_id}", status_code=204)
def delete_connector(connector_id: str) -> None:
    removed = _registry.remove(connector_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Connector not found")


@app.post("/connectors/{connector_id}/query")
def query_connector(connector_id: str, body: QueryRequest) -> dict:
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


@app.get("/connectors/{connector_id}/schema")
def get_schema(connector_id: str) -> dict:
    connector = _registry.build_connector(connector_id)
    if connector is None:
        raise HTTPException(status_code=404, detail="Connector not found")

    try:
        tables = connector.get_schema()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"tables": tables}


@app.post("/context")
def build_context(body: ContextRequest) -> dict:
    xml_block = _assembler.build_context(body.prompt, body.connector_ids)
    return {"enterprise_context": xml_block}


# ---------------------------------------------------------------------------
# Audit log endpoints
# ---------------------------------------------------------------------------


@app.get("/audit-log")
def get_audit_log() -> list[dict]:
    return _audit_logger.get_all()


@app.get("/audit-log/verify")
def verify_audit_log() -> dict:
    return {"valid": _audit_logger.verify_chain()}


@app.get("/audit-log/export", response_class=PlainTextResponse)
def export_audit_log() -> str:
    return _audit_logger.export_csv()


@app.get("/health")
def health() -> dict:
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
