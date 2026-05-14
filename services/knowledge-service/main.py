"""FastAPI knowledge service for PKL embedding and vector search."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import os
import math
from typing import Optional
from dotenv import load_dotenv

# I2CP — Intent-to-Code Pipeline (Innovation #1)
from intent_pipeline import IntentPipeline, IntentGraph, IntentNode, IntentType, IntentStatus

# ACW — Adaptive Context Window (Innovation #8)
from adaptive_context import ContextComposer, TaskMode, ContextSource, ContextItem

# Load environment
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)
logger = logging.getLogger(__name__)

PORT = int(os.getenv("PORT", "8003"))
MODEL_NAME = os.getenv("MODEL_NAME", "intfloat/e5-small-v2")
DEVICE = os.getenv("DEVICE", "cpu")

VERSION = "0.1.0"

# Lazy-loaded model (None until first /embed request)
_model = None
_model_loaded: bool = False


def _get_model():
    """Lazy-load the sentence-transformers model on first use."""
    global _model, _model_loaded
    if _model is not None:
        return _model
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore
        logger.info("Loading model %s on device %s", MODEL_NAME, DEVICE)
        _model = SentenceTransformer(MODEL_NAME, device=DEVICE)
        _model_loaded = True
        logger.info("Model loaded successfully")
        return _model
    except ImportError:
        logger.error("sentence-transformers is not installed")
        return None
    except Exception as exc:
        logger.error("Failed to load model: %s", exc)
        return None


# --- FastAPI app ---

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
app = FastAPI(
    title="Knowledge Service",
    description="Embedding and vector search service for the PKL system",
    version=VERSION,
)

# === W6 observability + logging (T17 + T18) =============================
import sys as _sys
from pathlib import Path as _Path
_shared_parent = _Path(__file__).resolve().parents[1]
if str(_shared_parent) not in _sys.path:
    _sys.path.insert(0, str(_shared_parent))
from _shared.observability import setup_metrics as _setup_metrics  # noqa: E402
from _shared.logging import install as _install_logging  # noqa: E402
_install_logging(app, "knowledge-service")
_setup_metrics(app, service_name="knowledge-service")
# ========================================================================

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5175,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5175").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)


# --- Request / Response models ---

class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]
    dim: int


class SnippetVector(BaseModel):
    id: str
    embedding: list[float]


class SearchRequest(BaseModel):
    query_embedding: list[float]
    snippets: list[SnippetVector]
    top_k: int = 5
    threshold: float = 0.0


class SearchHit(BaseModel):
    id: str
    score: float


class SearchResponse(BaseModel):
    results: list[SearchHit]


class HealthResponse(BaseModel):
    status: str
    version: str
    model_loaded: bool


# --- Utility ---

def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


# --- Routes ---

@limiter.limit("60/minute")
@app.get("/health", response_model=HealthResponse)
def health(request: Request) -> HealthResponse:
    """Return service health and model status."""
    return HealthResponse(
        status="ok",
        version=VERSION,
        model_loaded=_model_loaded,
    )


@limiter.limit("60/minute")
@app.post("/embed", response_model=EmbedResponse)
def embed(request: Request, req: EmbedRequest) -> EmbedResponse:
    """Embed text using the sentence-transformers model."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")

    model = _get_model()
    if model is None:
        raise HTTPException(status_code=503, detail="Model not available")

    try:
        vector = model.encode(req.text, convert_to_numpy=True).tolist()
        return EmbedResponse(embedding=vector, dim=len(vector))
    except Exception as exc:
        logger.error("Embedding failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Embedding failed: {exc}") from exc


@limiter.limit("60/minute")
@app.post("/search", response_model=SearchResponse)
def search(request: Request, req: SearchRequest) -> SearchResponse:
    """Return top-K snippets by cosine similarity to the query embedding."""
    if not req.snippets:
        return SearchResponse(results=[])

    scored: list[SearchHit] = []
    for snippet in req.snippets:
        score = _cosine_similarity(req.query_embedding, snippet.embedding)
        if score >= req.threshold:
            scored.append(SearchHit(id=snippet.id, score=score))

    scored.sort(key=lambda h: h.score, reverse=True)
    top = scored[: req.top_k]
    return SearchResponse(results=top)


# ──────────────────────────────────────────────────────────────
# I2CP — Intent-to-Code Pipeline (Innovation #1)
# ──────────────────────────────────────────────────────────────

_intent_pipeline = IntentPipeline()


class IntentExtractRequest(BaseModel):
    prompt: str


class IntentValidateRequest(BaseModel):
    graph_id: str
    code: str
    language: str = "python"
    file_path: Optional[str] = None


class IntentSearchRequest(BaseModel):
    query: str


@limiter.limit("30/minute")
@app.post("/api/v1/intent/extract")
def intent_extract(request: Request, req: IntentExtractRequest):
    """Extract an Intent Graph from a user prompt.

    Returns the graph with all extracted intent nodes.
    """
    try:
        graph = _intent_pipeline.extract_intent(req.prompt)
        return {
            "graph_id": graph.id,
            "nodes": {k: v.to_dict() for k, v in graph.nodes.items()},
            "total_intents": len(graph.nodes),
            "version": graph.version,
        }
    except Exception as e:
        logger.error(f"I2CP extract failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("30/minute")
@app.post("/api/v1/intent/validate")
def intent_validate(request: Request, req: IntentValidateRequest):
    """Validate generated code against an intent graph.

    Returns updated satisfaction statuses for each intent node.
    """
    try:
        graph = _intent_pipeline.validate_code(
            graph_id=req.graph_id,
            code=req.code,
            language=req.language,
            file_path=req.file_path,
        )
        return graph.get_satisfaction_report()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"I2CP validate failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("30/minute")
@app.post("/api/v1/intent/search")
def intent_search(request: Request, req: IntentSearchRequest):
    """Search for intent graphs matching a query."""
    try:
        results = _intent_pipeline.search_by_intent(req.query)
        return {
            "results": [
                {"graph_id": g.id, "prompt": g.prompt, "version": g.version}
                for g in results
            ],
            "total": len(results),
        }
    except Exception as e:
        logger.error(f"I2CP search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("10/minute")
@app.get("/api/v1/intent/{graph_id}")
def intent_get_graph(request: Request, graph_id: str):
    """Retrieve a stored intent graph by ID."""
    graph = _intent_pipeline.get_graph(graph_id)
    if not graph:
        raise HTTPException(status_code=404, detail=f"Intent graph {graph_id} not found")
    return graph.to_dict()


@limiter.limit("10/minute")
@app.get("/api/v1/intent/{graph_id}/report")
def intent_satisfaction_report(request: Request, graph_id: str):
    """Get a satisfaction report for an intent graph."""
    try:
        return _intent_pipeline.get_satisfaction_report(graph_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ──────────────────────────────────────────────────────────────
# LDE — Living Documentation Engine (Innovation #4)
# ──────────────────────────────────────────────────────────────

from living_docs_engine import LivingDocumentationEngine

_living_docs = LivingDocumentationEngine()


class LivingDocsIndexRequest(BaseModel):
    file_path: str
    code: str
    language: str = "python"


class LivingDocsStaleRequest(BaseModel):
    file_path: str
    code: str
    language: str = "python"


@limiter.limit("30/minute")
@app.post("/api/v1/living-docs/index")
def living_docs_index(request: Request, req: LivingDocsIndexRequest):
    """Index a code file and create a documentation graph.

    Returns the graph with code regions and doc sections.
    """
    try:
        graph = _living_docs.index_file(req.file_path, req.code, req.language)
        return {
            "file_path": req.file_path,
            "graph": graph.to_dict(),
            "freshness": graph.get_freshness_report(),
        }
    except Exception as e:
        logger.error(f"LDE index failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("30/minute")
@app.post("/api/v1/living-docs/stale")
def living_docs_detect_stale(request: Request, req: LivingDocsStaleRequest):
    """Detect documentation that is stale due to code changes."""
    try:
        stale = _living_docs.detect_stale_docs(req.file_path, req.code, req.language)
        return {
            "file_path": req.file_path,
            "stale_count": len(stale),
            "stale_sections": [s.to_dict() for s in stale],
        }
    except Exception as e:
        logger.error(f"LDE stale detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("10/minute")
@app.get("/api/v1/living-docs/freshness")
def living_docs_freshness(request: Request, file_path: str = ""):
    """Get a documentation freshness report."""
    return _living_docs.get_freshness_report(file_path)


@limiter.limit("10/minute")
@app.get("/api/v1/living-docs/{file_path:path}/propose/{doc_id}")
def living_docs_propose(request: Request, file_path: str, doc_id: str):
    """Propose an update for a stale documentation section."""
    graph = _living_docs.get_graph(file_path)
    if not graph:
        raise HTTPException(status_code=404, detail=f"File {file_path} not indexed")
    # Get current code from the graph
    result = _living_docs.propose_update(file_path, doc_id, "")
    return result


# ──────────────────────────────────────────────────────────────
# ACW — Adaptive Context Window (Innovation #8)
# ──────────────────────────────────────────────────────────────

_context_composer = ContextComposer()


class ACWComposeRequest(BaseModel):
    prompt: str
    open_files: list = []
    total_tokens: int = 4096


class ACWFeedbackRequest(BaseModel):
    source: str
    accepted: bool


@limiter.limit("30/minute")
@app.post("/api/v1/acw/compose")
def acw_compose(request: Request, req: ACWComposeRequest):
    """Compose the optimal context window for the current task."""
    try:
        context = _context_composer.compose(
            prompt=req.prompt,
            open_files=req.open_files,
            total_tokens=req.total_tokens,
        )
        return context.to_dict()
    except Exception as e:
        logger.error(f"ACW compose failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("60/minute")
@app.post("/api/v1/acw/feedback")
def acw_feedback(request: Request, req: ACWFeedbackRequest):
    """Record feedback on whether a context source led to accepted completion."""
    try:
        source = ContextSource(req.source)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid source: {req.source}")
    _context_composer.record_feedback(source, req.accepted)
    return {"status": "recorded", "source": req.source, "accepted": req.accepted}


@limiter.limit("10/minute")
@app.get("/api/v1/acw/feedback-stats")
def acw_feedback_stats(request: Request):
    """Get feedback statistics for context sources."""
    return _context_composer.get_feedback_stats()
