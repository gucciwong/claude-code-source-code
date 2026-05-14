import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from awards.models import ScoreSubmission
from awards.engine import submit_scores, compute_leaderboard, get_member_award, seed_demo_data

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
app = FastAPI(title="Award Service", version="0.1.0")

# === W6 observability + logging (T17 + T18) =============================
import sys as _sys
from pathlib import Path as _Path
_shared_parent = _Path(__file__).resolve().parents[1]
if str(_shared_parent) not in _sys.path:
    _sys.path.insert(0, str(_shared_parent))
from _shared.observability import setup_metrics as _setup_metrics  # noqa: E402
from _shared.logging import install as _install_logging  # noqa: E402
_install_logging(app, "award-service")
_setup_metrics(app, service_name="award-service")
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
@app.post("/awards/scores")
async def upsert_scores(request: Request, submission: ScoreSubmission):
    """Submit or update a member's award scores."""
    scores = submit_scores(submission)
    return {"status": "ok", "scores": scores}


@limiter.limit("60/minute")
@app.get("/awards/{org_id}/leaderboard")
async def leaderboard(request: Request, org_id: str):
    """Get the full org leaderboard."""
    return compute_leaderboard(org_id)


@limiter.limit("60/minute")
@app.get("/awards/{org_id}/member/{member_id}")
async def member_award(request: Request, org_id: str, member_id: str):
    """Get a single member's award details."""
    award = get_member_award(org_id, member_id)
    if not award:
        raise HTTPException(status_code=404, detail="Member not found")
    return award


@limiter.limit("60/minute")
@app.post("/awards/{org_id}/seed-demo")
async def seed_demo(request: Request, org_id: str):
    """Seed demo data for testing and demos."""
    lb = seed_demo_data(org_id)
    return lb


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8011)
