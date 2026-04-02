import uuid
from typing import List, Dict, Optional
from .embedder import CodeEmbedder
from .models import CodeChunk


class IndexManager:
    def __init__(self):
        self._embedder = CodeEmbedder()
        self._chunks: List[CodeChunk] = []
        self._embeddings = None          # numpy array, built lazily
        self._indexed_files: set = set()
        self._dirty = True

    def index_content(self, content: str, file_path: str, language: str = "python", metadata: dict = {}) -> int:
        import numpy as np
        # Remove existing chunks for this file
        self._chunks = [c for c in self._chunks if c.file_path != file_path]

        raw_chunks = self._embedder.chunk_code(content, file_path, language)
        # First pass: update doc freq
        for rc in raw_chunks:
            self._embedder.update_doc_freq(rc["chunk_text"])
        # Create chunk objects
        for rc in raw_chunks:
            chunk = CodeChunk(
                chunk_id=str(uuid.uuid4()),
                file_path=rc["file_path"],
                chunk_text=rc["chunk_text"],
                start_line=rc["start_line"],
                end_line=rc["end_line"],
                language=rc["language"],
                metadata=metadata,
            )
            self._chunks.append(chunk)
        self._indexed_files.add(file_path)
        self._dirty = True
        return len(raw_chunks)

    def get_embeddings(self):
        import numpy as np
        if self._dirty or self._embeddings is None:
            if not self._chunks:
                self._embeddings = np.zeros((0, self._embedder.dim))
            else:
                self._embeddings = np.vstack([self._embedder.embed(c.chunk_text) for c in self._chunks])
            self._dirty = False
        return self._embeddings

    def get_chunks(self) -> List[CodeChunk]:
        return self._chunks

    def clear(self) -> None:
        import numpy as np
        self._chunks = []
        self._embeddings = np.zeros((0, self._embedder.dim))
        self._indexed_files = set()
        self._dirty = True

    def get_status(self) -> dict:
        return {
            "total_chunks": len(self._chunks),
            "indexed_files": len(self._indexed_files),
            "status": "ready" if self._chunks else "empty",
        }
