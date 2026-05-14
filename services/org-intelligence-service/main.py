import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from org_intelligence.models import SharedPattern, ContributeRequest, SearchRequest, SkillGapReport, Bottleneck
from org_intelligence.registry import aggregator, skill_analyzer, bottleneck_detector

# PPTP — Privacy-Preserving Team Patterns (Innovation #5)
from org_intelligence.pattern_exchange import PatternExchange, PatternContribution, PatternType, AnonymizationLevel

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
app = FastAPI(title="Org Intelligence Service", version="0.1.0")

# === W6 observability + logging (T17 + T18) =============================
import sys as _sys
from pathlib import Path as _Path
_shared_parent = _Path(__file__).resolve().parents[1]
if str(_shared_parent) not in _sys.path:
    _sys.path.insert(0, str(_shared_parent))
from _shared.observability import setup_metrics as _setup_metrics  # noqa: E402
from _shared.logging import install as _install_logging  # noqa: E402
_install_logging(app, "org-intelligence-service")
_setup_metrics(app, service_name="org-intelligence-service")
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
def health(request: Request):
    return {"status": "ok", "version": "0.1.0"}


@limiter.limit("60/minute")
@app.post("/patterns/contribute", response_model=SharedPattern)
def contribute_pattern(request: Request, req: ContributeRequest) -> SharedPattern:
    return aggregator.contribute(req)


@limiter.limit("60/minute")
@app.get("/patterns/shared", response_model=List[SharedPattern])
def list_patterns(request: Request) -> List[SharedPattern]:
    return aggregator.list_patterns()


@limiter.limit("60/minute")
@app.post("/patterns/search", response_model=List[SharedPattern])
def search_patterns(request: Request, req: SearchRequest) -> List[SharedPattern]:
    return aggregator.search(req.query)


@limiter.limit("60/minute")
@app.get("/analytics/skill-gaps", response_model=SkillGapReport)
def get_skill_gaps(request: Request) -> SkillGapReport:
    patterns = aggregator.list_patterns()
    return skill_analyzer.analyze(patterns)


@limiter.limit("60/minute")
@app.get("/analytics/bottlenecks", response_model=List[Bottleneck])
def get_bottlenecks(request: Request) -> List[Bottleneck]:
    patterns = aggregator.list_patterns()
    return bottleneck_detector.detect(patterns)


# ──────────────────────────────────────────────────────────────
# PPTP — Privacy-Preserving Team Patterns (Innovation #5)
# ──────────────────────────────────────────────────────────────

_pattern_exchange = PatternExchange()


class PPTPContributeRequest:
    """Request body for contributing a pattern."""
    def __init__(self, code: str, language: str, pattern_type: str, title: str,
                 description: str, contributor_id: str, anonymization_level: str = "medium"):
        self.code = code
        self.language = language
        self.pattern_type = pattern_type
        self.title = title
        self.description = description
        self.contributor_id = contributor_id
        self.anonymization_level = anonymization_level


from pydantic import BaseModel


class PPTPContributeBody(BaseModel):
    code: str
    language: str
    pattern_type: str
    title: str
    description: str
    contributor_id: str
    anonymization_level: str = "medium"


class PPTPSearchBody(BaseModel):
    pattern_type: Optional[str] = None
    language: Optional[str] = None
    tags: Optional[List[str]] = None
    query: Optional[str] = None


class PPTPRateBody(BaseModel):
    rating: float


@limiter.limit("30/minute")
@app.post("/api/v1/pptp/contribute")
def pptp_contribute(request: Request, req: PPTPContributeBody):
    """Contribute a coding pattern. Code is anonymized before storage."""
    try:
        pattern_type = PatternType(req.pattern_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid pattern_type. Valid types: {[t.value for t in PatternType]}"
        )
    try:
        anon_level = AnonymizationLevel(req.anonymization_level)
    except ValueError:
        anon_level = AnonymizationLevel.MEDIUM

    contribution = PatternContribution(
        code=req.code,
        language=req.language,
        pattern_type=pattern_type,
        title=req.title,
        description=req.description,
        contributor_id=req.contributor_id,
        anonymization_level=anon_level,
    )

    pattern = _pattern_exchange.contribute(contribution)
    return pattern.to_dict()


@limiter.limit("60/minute")
@app.post("/api/v1/pptp/search")
def pptp_search(request: Request, req: PPTPSearchBody):
    """Search for anonymized patterns by type, language, tags, or query."""
    pattern_type = None
    if req.pattern_type:
        try:
            pattern_type = PatternType(req.pattern_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid pattern_type")

    results = _pattern_exchange.search(
        pattern_type=pattern_type,
        language=req.language,
        tags=req.tags,
        query=req.query,
    )
    return {"results": [p.to_dict() for p in results], "total": len(results)}


@limiter.limit("60/minute")
@app.get("/api/v1/pptp/pattern/{pattern_id}")
def pptp_get_pattern(request: Request, pattern_id: str):
    """Get a specific pattern by ID."""
    pattern = _pattern_exchange.get_pattern(pattern_id)
    if not pattern:
        raise HTTPException(status_code=404, detail=f"Pattern {pattern_id} not found")
    return pattern.to_dict()


@limiter.limit("60/minute")
@app.post("/api/v1/pptp/pattern/{pattern_id}/rate")
def pptp_rate_pattern(request: Request, pattern_id: str, req: PPTPRateBody):
    """Rate a pattern (1.0-5.0)."""
    if not 1.0 <= req.rating <= 5.0:
        raise HTTPException(status_code=400, detail="Rating must be between 1.0 and 5.0")
    success = _pattern_exchange.rate_pattern(pattern_id, req.rating)
    if not success:
        raise HTTPException(status_code=404, detail=f"Pattern {pattern_id} not found")
    return {"status": "rated", "pattern_id": pattern_id, "rating": req.rating}


@limiter.limit("10/minute")
@app.get("/api/v1/pptp/stats")
def pptp_stats(request: Request):
    """Get pattern exchange statistics."""
    return _pattern_exchange.get_stats()
