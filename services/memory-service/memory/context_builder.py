from .memory_store import MemoryStore
from typing import List

class ContextBuilder:
    """Builds compressed context from top-k relevant memories."""
    
    def __init__(self, store: MemoryStore):
        self._store = store
    
    def build(self, query: str, top_k: int = 5) -> dict:
        results = self._store.search(query, top_k)
        memories = [r["memory"] for r in results]
        
        # Build compressed context string
        parts = []
        for m in memories:
            tag_str = f"[{', '.join(m['tags'])}] " if m['tags'] else ""
            parts.append(f"{tag_str}{m['text']}")
        
        compressed = "\n---\n".join(parts)
        # Rough token estimate: 1 token ≈ 4 chars
        token_estimate = len(compressed) // 4
        
        return {
            "query": query,
            "relevant_memories": memories,
            "compressed_context": compressed,
            "token_estimate": token_estimate,
        }
