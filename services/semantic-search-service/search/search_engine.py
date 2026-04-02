from typing import List, Optional
from .index_manager import IndexManager
from .embedder import CodeEmbedder


class SearchEngine:
    def __init__(self, index: IndexManager):
        self._index = index
        self._embedder = index._embedder

    def search(self, query: str, top_k: int = 5, language_filter: Optional[str] = None) -> List[dict]:
        import numpy as np
        embeddings = self._index.get_embeddings()
        chunks = self._index.get_chunks()

        if language_filter:
            filtered = [(i, c) for i, c in enumerate(chunks) if c.language == language_filter]
            if not filtered:
                return []
            idxs, filtered_chunks = zip(*filtered)
            filtered_embeddings = embeddings[list(idxs)] if len(embeddings) > 0 else np.zeros((0, self._embedder.dim))
        else:
            filtered_chunks = chunks
            filtered_embeddings = embeddings

        if len(filtered_embeddings) == 0:
            return []

        q_vec = self._embedder.embed(query)
        if np.linalg.norm(q_vec) == 0:
            return []

        scores = filtered_embeddings @ q_vec
        top_indices = scores.argsort()[::-1][:top_k]

        results = []
        for idx in top_indices:
            chunk = filtered_chunks[idx]
            results.append({
                "file_path": chunk.file_path,
                "chunk_text": chunk.chunk_text,
                "start_line": chunk.start_line,
                "end_line": chunk.end_line,
                "score": float(scores[idx]),
                "language": chunk.language,
            })
        return results
