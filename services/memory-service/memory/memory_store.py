import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict
import math
import re
from collections import defaultdict

class MemoryStore:
    """In-memory store with TF-IDF relevance ranking."""
    
    def __init__(self):
        self._memories: Dict[str, dict] = {}
        self._doc_freq: Dict[str, int] = defaultdict(int)
    
    def _tokenize(self, text: str) -> List[str]:
        tokens = re.split(r'\W+', text.lower())
        return [t for t in tokens if len(t) > 1]
    
    def _update_doc_freq(self, tokens: List[str]) -> None:
        for t in set(tokens):
            self._doc_freq[t] += 1
    
    def _tf_idf_score(self, query_tokens: List[str], doc_tokens: List[str]) -> float:
        n = len(self._memories)
        if n == 0:
            return 0.0
        score = 0.0
        tf_map = defaultdict(int)
        for t in doc_tokens:
            tf_map[t] += 1
        for qt in query_tokens:
            tf = tf_map.get(qt, 0) / max(len(doc_tokens), 1)
            df = self._doc_freq.get(qt, 0)
            idf = math.log((n + 1) / (df + 1))
            score += tf * idf
        return score
    
    def add(self, text: str, tags: List[str] = None) -> dict:
        mem_id = str(uuid.uuid4())
        tokens = self._tokenize(text)
        self._update_doc_freq(tokens)
        mem = {
            "id": mem_id,
            "text": text,
            "tags": tags or [],
            "relevance_score": 0.0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._memories[mem_id] = mem
        return mem
    
    def search(self, query: str, top_k: int = 5) -> List[dict]:
        if not self._memories:
            return []
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return list(self._memories.values())[:top_k]
        
        scored = []
        for mem in self._memories.values():
            doc_tokens = self._tokenize(mem["text"])
            score = self._tf_idf_score(query_tokens, doc_tokens)
            scored.append({"memory": mem, "score": round(score, 4)})
        
        scored.sort(key=lambda x: -x["score"])
        return scored[:top_k]
    
    def list(self) -> List[dict]:
        return list(self._memories.values())
    
    def remove(self, memory_id: str) -> bool:
        if memory_id not in self._memories:
            return False
        del self._memories[memory_id]
        return True
    
    def count(self) -> int:
        return len(self._memories)
    
    def clear(self) -> None:
        self._memories.clear()
        self._doc_freq.clear()
