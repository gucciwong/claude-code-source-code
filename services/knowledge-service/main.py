"""FastAPI knowledge service for PKL embedding and vector search."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import os
import math
from typing import Optional
from dotenv import load_dotenv

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

app = FastAPI(
    title="Knowledge Service",
    description="Embedding and vector search service for the PKL system",
    version=VERSION,
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5175,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5175").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Return service health and model status."""
    return HealthResponse(
        status="ok",
        version=VERSION,
        model_loaded=_model_loaded,
    )


@app.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest) -> EmbedResponse:
    """Embed text using the sentence-transformers model."""
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")

    model = _get_model()
    if model is None:
        raise HTTPException(status_code=503, detail="Model not available")

    try:
        vector = model.encode(request.text, convert_to_numpy=True).tolist()
        return EmbedResponse(embedding=vector, dim=len(vector))
    except Exception as exc:
        logger.error("Embedding failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Embedding failed: {exc}") from exc


@app.post("/search", response_model=SearchResponse)
def search(request: SearchRequest) -> SearchResponse:
    """Return top-K snippets by cosine similarity to the query embedding."""
    if not request.snippets:
        return SearchResponse(results=[])

    scored: list[SearchHit] = []
    for snippet in request.snippets:
        score = _cosine_similarity(request.query_embedding, snippet.embedding)
        if score >= request.threshold:
            scored.append(SearchHit(id=snippet.id, score=score))

    scored.sort(key=lambda h: h.score, reverse=True)
    top = scored[: request.top_k]
    return SearchResponse(results=top)
