import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from review.registry import diff_parser, rule_engine, comment_generator

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
app = FastAPI(title="Sovereign Code PR Review", version="0.1.0")

# === W6 observability + logging (T17 + T18) =============================
import sys as _sys
from pathlib import Path as _Path
_shared_parent = _Path(__file__).resolve().parents[1]
if str(_shared_parent) not in _sys.path:
    _sys.path.insert(0, str(_shared_parent))
from _shared.observability import setup_metrics as _setup_metrics  # noqa: E402
from _shared.logging import install as _install_logging  # noqa: E402
_install_logging(app, "pr-review-service")
_setup_metrics(app, service_name="pr-review-service")
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


class ReviewRequest(BaseModel):
    diff: str
    language: str = "python"
    rules: List[str] = []  # empty = use all rules


class ReviewComment(BaseModel):
    file_path: str
    line: int
    severity: str  # "error" | "warning" | "info"
    rule: str
    message: str


class ReviewSummary(BaseModel):
    total_files: int
    total_changes: int
    errors: int
    warnings: int
    infos: int
    score: float  # 0-100 quality score


class ReviewResult(BaseModel):
    summary: ReviewSummary
    comments: List[ReviewComment]
    approved: bool


@limiter.limit("60/minute")
@app.post("/review", response_model=ReviewResult)
async def review_diff(request: Request, req: ReviewRequest):
    parsed = diff_parser.parse(req.diff)
    violations = rule_engine.evaluate(parsed, req.rules)
    result = comment_generator.generate(parsed, violations)
    return result


@limiter.limit("60/minute")
@app.get("/rules")
async def list_rules(request: Request):
    return {"rules": rule_engine.list_rules()}


@limiter.limit("60/minute")
@app.post("/rules")
async def add_rule(request: Request, rule: dict):
    rule_engine.add_custom_rule(rule)
    return {"status": "ok"}


@limiter.limit("60/minute")
@app.get("/health")
async def health(request: Request):
    return {"status": "ok", "version": "0.1.0"}
