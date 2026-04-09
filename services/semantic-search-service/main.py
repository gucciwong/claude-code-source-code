import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict

from search.registry import search_engine, index_manager

# SDG — Semantic Dependency Graph (Innovation #7)
from search.semantic_dep_graph import SemanticDependencyGraph, DependencyType

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
app = FastAPI(title="Sovereign Code Semantic Search", version="0.1.0")

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


class IndexRequest(BaseModel):
    content: str
    file_path: str
    language: str = "python"
    metadata: Dict[str, str] = {}


class FileIndexRequest(BaseModel):
    file_paths: List[str]


class SearchResult(BaseModel):
    file_path: str
    chunk_text: str
    start_line: int
    end_line: int
    score: float
    language: str


class IndexStatus(BaseModel):
    total_chunks: int
    indexed_files: int
    status: str


@limiter.limit("60/minute")
@app.post("/index")
async def index_content(request: Request, req: IndexRequest):
    chunk_count = index_manager.index_content(req.content, req.file_path, req.language, req.metadata)
    return {"status": "ok", "chunks_indexed": chunk_count, "file_path": req.file_path}


@limiter.limit("60/minute")
@app.delete("/index")
async def clear_index(request: Request):
    index_manager.clear()
    return {"status": "ok", "message": "Index cleared"}


@limiter.limit("60/minute")
@app.get("/index/status", response_model=IndexStatus)
async def get_status(request: Request):
    return index_manager.get_status()


@limiter.limit("60/minute")
@app.get("/search")
async def search(request: Request, q: str, top_k: int = 5, language: Optional[str] = None) -> List[SearchResult]:
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    results = search_engine.search(q, top_k=top_k, language_filter=language)
    return results


@limiter.limit("60/minute")
@app.get("/health")
async def health(request: Request):
    return {"status": "ok", "version": "0.1.0"}


# ──────────────────────────────────────────────────────────────
# SDG — Semantic Dependency Graph (Innovation #7)
# ──────────────────────────────────────────────────────────────

_sdg = SemanticDependencyGraph()


class SDGIndexRequest(BaseModel):
    file_path: str
    code: str
    language: str = "python"


class SDGImpactRequest(BaseModel):
    file_path: str
    changed_symbols: Optional[List[str]] = None


class SDGDependenciesRequest(BaseModel):
    file_path: str
    dep_type: Optional[str] = None


@limiter.limit("30/minute")
@app.post("/api/v1/sdg/index")
async def sdg_index(request: Request, req: SDGIndexRequest):
    """Index a file in the semantic dependency graph."""
    try:
        nodes = _sdg.index_file(req.file_path, req.code, req.language)
        return {
            "file_path": req.file_path,
            "nodes_created": len(nodes),
            "stats": _sdg.get_stats(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("30/minute")
@app.post("/api/v1/sdg/impact")
async def sdg_impact(request: Request, req: SDGImpactRequest):
    """Compute the impact of a change to a file."""
    try:
        report = _sdg.compute_impact(req.file_path, req.changed_symbols)
        return report.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("60/minute")
@app.post("/api/v1/sdg/dependencies")
async def sdg_dependencies(request: Request, req: SDGDependenciesRequest):
    """Get all dependencies for a file."""
    dep_type = None
    if req.dep_type:
        try:
            dep_type = DependencyType(req.dep_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid dep_type: {req.dep_type}")
    edges = _sdg.get_dependencies(req.file_path, dep_type)
    return {
        "file_path": req.file_path,
        "dependencies": [e.to_dict() for e in edges],
        "total": len(edges),
    }


@limiter.limit("10/minute")
@app.get("/api/v1/sdg/stats")
async def sdg_stats(request: Request):
    """Get semantic dependency graph statistics."""
    return _sdg.get_stats()
