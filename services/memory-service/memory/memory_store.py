"""W6-T16 — Memory store with optional SQLite persistence.

Public API is unchanged from the in-memory implementation; existing tests in
`tests/test_memory_store.py` continue to pass against the default
constructor (no `db_path` → in-memory only).

When `db_path` is provided (set by `registry.py` from the `MEMORY_DB_PATH`
env var), memories survive process restarts. Document-frequency counts are
recomputed from the table on demand, so TF-IDF stays accurate even after
arbitrary deletes / reloads.

Schema:
  memories(
    id           TEXT PRIMARY KEY,
    text         TEXT NOT NULL,
    tags         TEXT NOT NULL DEFAULT '[]',   -- JSON-encoded list[str]
    timestamp    TEXT NOT NULL
  )
"""

from __future__ import annotations

import json
import math
import re
import sqlite3
import threading
import uuid
from collections import defaultdict
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterator, List, Optional


_SCHEMA = """
CREATE TABLE IF NOT EXISTS memories (
    id        TEXT PRIMARY KEY,
    text      TEXT NOT NULL,
    tags      TEXT NOT NULL DEFAULT '[]',
    timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);
"""


class MemoryStore:
    """Memory store with optional SQLite-backed persistence.

    Parameters
    ----------
    db_path:
        If given, persist memories to this SQLite file. Otherwise keep
        them in a process-local dict (backwards-compatible default).
    """

    def __init__(self, db_path: Optional[Path | str] = None) -> None:
        self._db_path: Optional[Path] = Path(db_path) if db_path else None
        self._lock = threading.Lock()
        # When in-memory only, this dict holds the canonical state.
        self._memories: Dict[str, dict] = {}
        # Document-frequency cache (recomputed from disk on each add when
        # persistent). For in-memory mode this stays as the legacy cache.
        self._doc_freq: Dict[str, int] = defaultdict(int)

        if self._db_path is not None:
            self._db_path.parent.mkdir(parents=True, exist_ok=True)
            self._init_schema()
            # Warm the doc-freq cache from disk so TF-IDF works on first query.
            self._rebuild_doc_freq()

    # ------------------------------------------------------------------
    # SQLite plumbing
    # ------------------------------------------------------------------

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        if self._db_path is None:
            raise RuntimeError("memory store: db_path is None — caller bug")
        conn = sqlite3.connect(self._db_path, isolation_level=None)
        try:
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=NORMAL")
            yield conn
        finally:
            conn.close()

    def _init_schema(self) -> None:
        with self._conn() as conn:
            conn.executescript(_SCHEMA)

    def _rebuild_doc_freq(self) -> None:
        if self._db_path is None:
            return
        self._doc_freq = defaultdict(int)
        with self._conn() as conn:
            for (text,) in conn.execute("SELECT text FROM memories"):
                tokens = self._tokenize(text)
                for tok in set(tokens):
                    self._doc_freq[tok] += 1

    # ------------------------------------------------------------------
    # TF-IDF helpers (unchanged from the in-memory implementation)
    # ------------------------------------------------------------------

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        tokens = re.split(r"\W+", text.lower())
        return [t for t in tokens if len(t) > 1]

    def _update_doc_freq(self, tokens: List[str]) -> None:
        for t in set(tokens):
            self._doc_freq[t] += 1

    def _tf_idf_score(self, query_tokens: List[str], doc_tokens: List[str], n: int) -> float:
        if n == 0:
            return 0.0
        score = 0.0
        tf_map: Dict[str, int] = defaultdict(int)
        for t in doc_tokens:
            tf_map[t] += 1
        for qt in query_tokens:
            tf = tf_map.get(qt, 0) / max(len(doc_tokens), 1)
            df = self._doc_freq.get(qt, 0)
            idf = math.log((n + 1) / (df + 1))
            score += tf * idf
        return score

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add(self, text: str, tags: Optional[List[str]] = None) -> dict:
        mem_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()
        tags = tags or []
        mem = {
            "id": mem_id,
            "text": text,
            "tags": tags,
            "relevance_score": 0.0,
            "timestamp": timestamp,
        }

        if self._db_path is None:
            with self._lock:
                self._update_doc_freq(self._tokenize(text))
                self._memories[mem_id] = mem
            return mem

        # Persistent mode
        with self._lock, self._conn() as conn:
            conn.execute(
                "INSERT INTO memories (id, text, tags, timestamp) VALUES (?, ?, ?, ?)",
                (mem_id, text, json.dumps(tags), timestamp),
            )
            self._update_doc_freq(self._tokenize(text))
        return mem

    def list(self) -> List[dict]:
        if self._db_path is None:
            return list(self._memories.values())
        with self._lock, self._conn() as conn:
            rows = conn.execute(
                "SELECT id, text, tags, timestamp FROM memories ORDER BY timestamp"
            ).fetchall()
        return [self._row_to_mem(r) for r in rows]

    def search(self, query: str, top_k: int = 5) -> List[dict]:
        memories = self.list()
        if not memories:
            return []
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return [{"memory": m, "score": 0.0} for m in memories[:top_k]]

        n = len(memories)
        scored = []
        for mem in memories:
            doc_tokens = self._tokenize(mem["text"])
            score = self._tf_idf_score(query_tokens, doc_tokens, n)
            scored.append({"memory": mem, "score": round(score, 4)})
        scored.sort(key=lambda x: -x["score"])
        return scored[:top_k]

    def remove(self, memory_id: str) -> bool:
        if self._db_path is None:
            with self._lock:
                if memory_id not in self._memories:
                    return False
                # Decrement doc-freq before deletion
                tokens = self._tokenize(self._memories[memory_id]["text"])
                for tok in set(tokens):
                    self._doc_freq[tok] = max(0, self._doc_freq[tok] - 1)
                del self._memories[memory_id]
                return True

        with self._lock, self._conn() as conn:
            row = conn.execute(
                "SELECT text FROM memories WHERE id = ?", (memory_id,)
            ).fetchone()
            if row is None:
                return False
            tokens = self._tokenize(row[0])
            conn.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
            for tok in set(tokens):
                self._doc_freq[tok] = max(0, self._doc_freq[tok] - 1)
            return True

    def count(self) -> int:
        if self._db_path is None:
            return len(self._memories)
        with self._lock, self._conn() as conn:
            row = conn.execute("SELECT COUNT(*) FROM memories").fetchone()
        return int(row[0])

    def clear(self) -> None:
        with self._lock:
            self._memories.clear()
            self._doc_freq = defaultdict(int)
        if self._db_path is None:
            return
        with self._lock, self._conn() as conn:
            conn.execute("DELETE FROM memories")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _row_to_mem(row) -> dict:
        mem_id, text, tags_json, timestamp = row
        try:
            tags = json.loads(tags_json)
        except (TypeError, ValueError, json.JSONDecodeError):
            tags = []
        return {
            "id": mem_id,
            "text": text,
            "tags": tags,
            "relevance_score": 0.0,
            "timestamp": timestamp,
        }
