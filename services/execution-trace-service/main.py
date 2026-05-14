from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# === W3-T8: local-token authentication ====================================
# Provides FastAPI Depends(verify_local_token). The shared module lives at
# repo-root services/_shared/. We resolve it via sys.path so this service
# runs both standalone (dev) and from the packaged Docker image once
# W3-T8b lands the build-context fix (see GA Runway Plan).
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

# PBR — Predictive Bug Radar (Innovation #2)
from execution_trace.predictive_bug_radar import PredictiveBugEngine, BugCategory

# CAE — Code Archaeology Engine (Innovation #10)
from execution_trace.code_archaeology import CodeArchaeologyEngine, ChangeIntent
app = FastAPI(title="Execution Trace Service", version="0.1.0")

# W6-T17 + T18: install JSON logging + request-id middleware + /metrics.
install_logging(app, "execution-trace-service")
setup_metrics(app, service_name="execution-trace-service")

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

PORT = int(os.getenv("PORT", "8005"))


class TraceRequest(BaseModel):
    code: str
    timeout_ms: int = 5000  # default 5 second timeout


class TraceResponse(BaseModel):
    lines: list[dict]  # list of TraceEvent dicts
    error: str | None = None
    duration_ms: float
    language: str


@limiter.limit("60/minute")
@app.post("/trace/python", response_model=TraceResponse)
async def trace_python(
    request: Request,
    req: TraceRequest,
    _token: str = Depends(verify_local_token),
) -> TraceResponse:
    from execution_trace.python_runner import PythonRunner
    runner = PythonRunner()
    return runner.run(req.code, req.timeout_ms)


@limiter.limit("60/minute")
@app.post("/trace/js", response_model=TraceResponse)
async def trace_js(
    request: Request,
    req: TraceRequest,
    _token: str = Depends(verify_local_token),
) -> TraceResponse:
    from execution_trace.js_runner import JSRunner
    runner = JSRunner()
    return runner.run(req.code, req.timeout_ms)


@limiter.limit("60/minute")
@app.get("/health")
async def health(request: Request):
    import shutil
    return {
        "status": "ok",
        "python_available": True,
        "node_available": shutil.which("node") is not None,
    }


# ──────────────────────────────────────────────────────────────
# PBR — Predictive Bug Radar (Innovation #2)
# ──────────────────────────────────────────────────────────────

_bug_radar = PredictiveBugEngine()


class BugRadarRequest(BaseModel):
    code: str
    file_path: str = ""
    language: str = "python"


class BugRadarRecordRequest(BaseModel):
    file_path: str
    line: int
    error_type: str
    error_message: str


class BugPatternRequest(BaseModel):
    pattern_type: str
    code_pattern: str
    error_rate: float


@limiter.limit("30/minute")
@app.post("/api/v1/bug-radar/analyze")
async def bug_radar_analyze(
    request: Request,
    req: BugRadarRequest,
    _token: str = Depends(verify_local_token),
):
    """Analyze code for predicted bugs and return a heatmap.

    Returns line-by-line bug probability predictions.
    """
    try:
        heatmap = _bug_radar.analyze(req.file_path, req.code, req.language)
        return heatmap.to_dict()
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("60/minute")
@app.post("/api/v1/bug-radar/record")
async def bug_radar_record(
    request: Request,
    req: BugRadarRecordRequest,
    _token: str = Depends(verify_local_token),
):
    """Record an actual error from execution traces for learning.

    This improves future predictions by learning from real errors.
    """
    try:
        _bug_radar.record_trace_result(
            file_path=req.file_path,
            line=req.line,
            error_type=req.error_type,
            error_message=req.error_message,
        )
        return {"status": "recorded", "file_path": req.file_path, "line": req.line}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("10/minute")
@app.post("/api/v1/bug-radar/patterns")
async def bug_radar_add_pattern(
    request: Request,
    req: BugPatternRequest,
    _token: str = Depends(verify_local_token),
):
    """Add a custom bug pattern learned from user traces.

    This allows the radar to learn project-specific patterns.
    """
    try:
        category = BugCategory(req.pattern_type)
        _bug_radar.add_pattern(
            pattern_type=category,
            code_pattern=req.code_pattern,
            error_rate=req.error_rate,
        )
        return {"status": "added", "pattern_type": req.pattern_type}
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid pattern_type: {req.pattern_type}")
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# CAE — Code Archaeology Engine (Innovation #10)
# ---------------------------------------------------------------------------

_cae_engine = CodeArchaeologyEngine()


class ArchaeologyRequest(BaseModel):
    commits: list[dict]
    file_path: str | None = None


class QueryRequest(BaseModel):
    question: str
    commits: list[dict] | None = None


@limiter.limit("30/minute")
@app.post("/api/v1/cae/analyze")
async def cae_analyze(
    request: Request,
    req: ArchaeologyRequest,
    _token: str = Depends(verify_local_token),
) -> dict:
    """Analyze git commits to produce an archaeology report."""
    try:
        report = _cae_engine.analyze(req.commits, file_path=req.file_path)
        return report.to_dict()
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("30/minute")
@app.post("/api/v1/cae/query")
async def cae_query(
    request: Request,
    req: QueryRequest,
    _token: str = Depends(verify_local_token),
) -> dict:
    """Answer a natural-language question about code history."""
    try:
        result = _cae_engine.query(req.question, commits=req.commits)
        return result
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("60/minute")
@app.get("/api/v1/cae/stats")
async def cae_stats(request: Request) -> dict:
    """Get Code Archaeology Engine statistics."""
    return _cae_engine.get_stats()
