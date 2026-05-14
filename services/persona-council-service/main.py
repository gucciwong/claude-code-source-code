import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from persona_council.models import ReviewRequest, CouncilReport
from persona_council.council import CouncilOrchestrator, PERSONAS

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
app = FastAPI(title="Persona Council Service", version="0.1.0")

# === W6 observability + logging (T17 + T18) =============================
import sys as _sys
from pathlib import Path as _Path
_shared_parent = _Path(__file__).resolve().parents[1]
if str(_shared_parent) not in _sys.path:
    _sys.path.insert(0, str(_shared_parent))
from _shared.observability import setup_metrics as _setup_metrics  # noqa: E402
from _shared.logging import install as _install_logging  # noqa: E402
_install_logging(app, "persona-council-service")
_setup_metrics(app, service_name="persona-council-service")
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

orchestrator = CouncilOrchestrator()


@limiter.limit("60/minute")
@app.post("/review", response_model=CouncilReport)
async def review_code(request: Request, req: ReviewRequest) -> CouncilReport:
    return orchestrator.review(req)


@limiter.limit("60/minute")
@app.get("/personas")
async def list_personas(request: Request):
    return [
        {
            "name": p.NAME,
            "description": p.DESCRIPTION,
        }
        for p in PERSONAS
    ]


@limiter.limit("60/minute")
@app.get("/health")
async def health(request: Request):
    return {"status": "ok", "version": "0.1.0"}
