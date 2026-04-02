from pydantic import BaseModel
from typing import List, Optional

class Memory(BaseModel):
    id: str
    text: str
    tags: List[str] = []
    relevance_score: float = 0.0
    timestamp: str

class MemorySearchResult(BaseModel):
    memory: Memory
    score: float

class ContextSummary(BaseModel):
    query: str
    relevant_memories: List[Memory]
    compressed_context: str
    token_estimate: int
