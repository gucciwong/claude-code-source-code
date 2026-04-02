from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict

from search.registry import search_engine, index_manager

app = FastAPI(title="Sovereign Code Semantic Search", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


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


@app.post("/index")
async def index_content(req: IndexRequest):
    chunk_count = index_manager.index_content(req.content, req.file_path, req.language, req.metadata)
    return {"status": "ok", "chunks_indexed": chunk_count, "file_path": req.file_path}


@app.delete("/index")
async def clear_index():
    index_manager.clear()
    return {"status": "ok", "message": "Index cleared"}


@app.get("/index/status", response_model=IndexStatus)
async def get_status():
    return index_manager.get_status()


@app.get("/search")
async def search(q: str, top_k: int = 5, language: Optional[str] = None) -> List[SearchResult]:
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    results = search_engine.search(q, top_k=top_k, language_filter=language)
    return results


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
