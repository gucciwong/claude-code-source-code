import math
import re
from typing import List, Tuple
from collections import Counter

CHUNK_SIZE = 40   # lines per chunk
OVERLAP    = 5    # lines of overlap between chunks


class CodeEmbedder:
    """
    Lightweight bag-of-words TF-IDF embedder for code.
    No external ML deps — pure Python + numpy.
    """

    def __init__(self, dim: int = 256):
        self.dim = dim
        self._vocab: dict = {}
        self._doc_freq: Counter = Counter()
        self._total_docs: int = 0

    # ── tokenisation ────────────────────────────────────────────────────────
    def _tokenize(self, text: str) -> List[str]:
        # split on non-alphanumeric, lowercase, drop empties / short tokens
        return [t.lower() for t in re.split(r'[^a-zA-Z0-9_]', text) if len(t) >= 2]

    def _term_freq(self, tokens: List[str]) -> Counter:
        return Counter(tokens)

    # ── vocabulary ──────────────────────────────────────────────────────────
    def _get_or_add(self, term: str) -> int:
        if term not in self._vocab:
            self._vocab[term] = len(self._vocab) % self.dim
        return self._vocab[term]

    # ── public API ──────────────────────────────────────────────────────────
    def update_doc_freq(self, text: str) -> None:
        tokens = set(self._tokenize(text))
        for t in tokens:
            self._doc_freq[t] += 1
        self._total_docs += 1

    def embed(self, text: str):
        """Return a unit-normalised numpy array of shape (dim,)."""
        import numpy as np
        tokens = self._tokenize(text)
        if not tokens:
            return np.zeros(self.dim)
        tf = self._term_freq(tokens)
        vec = np.zeros(self.dim)
        for term, count in tf.items():
            idx = self._get_or_add(term)
            df = self._doc_freq.get(term, 0)
            idf = math.log((self._total_docs + 1) / (df + 1)) + 1.0
            vec[idx] += (count / len(tokens)) * idf
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    # ── chunking ─────────────────────────────────────────────────────────────
    def chunk_code(self, content: str, file_path: str, language: str) -> List[dict]:
        """Split content into overlapping line-windows and return raw dicts."""
        lines = content.splitlines()
        chunks = []
        i = 0
        while i < len(lines):
            end = min(i + CHUNK_SIZE, len(lines))
            text = "\n".join(lines[i:end])
            chunks.append({
                "file_path": file_path,
                "chunk_text": text,
                "start_line": i + 1,
                "end_line": end,
                "language": language,
            })
            if end >= len(lines):
                break
            i += CHUNK_SIZE - OVERLAP
        return chunks
