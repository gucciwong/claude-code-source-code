from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from memory.registry import memory_store, context_builder

app = FastAPI(title="Sovereign Code Memory Service", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class MemoryAddRequest(BaseModel):
    text: str
    tags: List[str] = []

class ContextBuildRequest(BaseModel):
    query: str
    top_k: int = 5

@app.post("/memories")
async def add_memory(req: MemoryAddRequest):
    mem = memory_store.add(req.text, req.tags)
    return mem

@app.get("/memories/search")
async def search_memories(q: str = Query(...), top_k: int = Query(5)):
    results = memory_store.search(q, top_k)
    return {"results": results, "count": len(results)}

@app.get("/memories")
async def list_memories():
    return {"memories": memory_store.list(), "count": memory_store.count()}

@app.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str):
    removed = memory_store.remove(memory_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "ok"}

@app.post("/context/build")
async def build_context(req: ContextBuildRequest):
    ctx = context_builder.build(req.query, req.top_k)
    return ctx

@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0", "memories": memory_store.count()}
