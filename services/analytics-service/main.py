import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from typing import Optional

from analytics.models import MetricEvent
from analytics.registry import collector, productivity_calc, quality_analyzer, roi_calculator, exporter

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
app = FastAPI(title="Analytics Service", version="0.1.0")

# === W6 observability + logging (T17 + T18) =============================
# services/_shared lives at /app/_shared in containers (W3-T8b Docker
# context) and at services/_shared in dev. We add the parent to sys.path
# so the same import line works in both modes.
import sys as _sys
from pathlib import Path as _Path
_shared_parent = _Path(__file__).resolve().parents[1]
if str(_shared_parent) not in _sys.path:
    _sys.path.insert(0, str(_shared_parent))
from _shared.observability import setup_metrics as _setup_metrics  # noqa: E402
from _shared.logging import install as _install_logging  # noqa: E402
_install_logging(app, "analytics-service")
_setup_metrics(app, service_name="analytics-service")
# ========================================================================

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


@limiter.limit("60/minute")
@app.get("/health")
async def health(request: Request):
    return {"status": "ok", "version": "0.1.0"}


@limiter.limit("60/minute")
@app.post("/events")
async def ingest_event(request: Request, event: MetricEvent):
    event_id = collector.ingest(event)
    return {"status": "ok", "id": event_id}


@limiter.limit("60/minute")
@app.get("/metrics/productivity")
async def get_productivity(request: Request):
    return productivity_calc.calculate()


@limiter.limit("60/minute")
@app.get("/metrics/quality-trends")
async def get_quality_trends(request: Request):
    return quality_analyzer.analyze()


@limiter.limit("60/minute")
@app.get("/metrics/training-roi")
async def get_training_roi(request: Request):
    return roi_calculator.calculate()


@limiter.limit("60/minute")
@app.get("/reports/export")
async def export_report(request: Request,
    format: str = Query("json", pattern="^(json|csv)$"),
    start: Optional[float] = None,
    end: Optional[float] = None,
):
    if format == "csv":
        data = exporter.export_csv()
        return PlainTextResponse(content=data, media_type="text/csv")
    else:
        data = exporter.export_json()
        return PlainTextResponse(content=data, media_type="application/json")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8009)
