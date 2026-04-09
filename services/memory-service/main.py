import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from memory.registry import memory_store, context_builder

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
app = FastAPI(title="Sovereign Code Memory Service", version="0.1.0")

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

class MemoryAddRequest(BaseModel):
    text: str
    tags: List[str] = []

class ContextBuildRequest(BaseModel):
    query: str
    top_k: int = 5

@limiter.limit("60/minute")
@app.post("/memories")
async def add_memory(request: Request, req: MemoryAddRequest):
    mem = memory_store.add(req.text, req.tags)
    return mem

@limiter.limit("60/minute")
@app.get("/memories/search")
async def search_memories(request: Request, q: str = Query(...), top_k: int = Query(5)):
    results = memory_store.search(q, top_k)
    return {"results": results, "count": len(results)}

@limiter.limit("60/minute")
@app.get("/memories")
async def list_memories(request: Request):
    return {"memories": memory_store.list(), "count": memory_store.count()}

@limiter.limit("60/minute")
@app.delete("/memories/{memory_id}")
async def delete_memory(request: Request, memory_id: str):
    removed = memory_store.remove(memory_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "ok"}

@limiter.limit("60/minute")
@app.post("/context/build")
async def build_context(request: Request, req: ContextBuildRequest):
    ctx = context_builder.build(req.query, req.top_k)
    return ctx

@limiter.limit("60/minute")
@app.get("/health")
async def health(request: Request):
    return {"status": "ok", "version": "0.1.0", "memories": memory_store.count()}
