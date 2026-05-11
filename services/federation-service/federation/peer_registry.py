"""W6-T16b — Federation peer registry with optional SQLite persistence.

Same backward-compat contract as MemoryStore + PluginRegistry: bare
constructor stays in-memory (preserves existing tests); `db_path=<path>`
enables SQLite WAL persistence so peer membership survives restarts —
critical for federated training where a long-running round must remember
which peers contributed weights.
"""

from __future__ import annotations

import json
import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Dict, Iterator, List, Optional


_SCHEMA = """
CREATE TABLE IF NOT EXISTS peers (
    peer_id  TEXT PRIMARY KEY,
    info     TEXT NOT NULL
);
"""


class PeerRegistry:
    def __init__(self, db_path: Optional[Path | str] = None) -> None:
        self._db_path: Optional[Path] = Path(db_path) if db_path else None
        self._lock = threading.Lock()
        self._peers: Dict[str, dict] = {}
        if self._db_path is not None:
            self._db_path.parent.mkdir(parents=True, exist_ok=True)
            self._init_schema()

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        if self._db_path is None:
            raise RuntimeError("peer registry: db_path is None — caller bug")
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

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def register(self, peer: dict) -> None:
        peer_id = peer["peer_id"]
        snapshot = dict(peer)
        if self._db_path is None:
            with self._lock:
                self._peers[peer_id] = snapshot
            return
        with self._lock, self._conn() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO peers (peer_id, info) VALUES (?, ?)",
                (peer_id, json.dumps(snapshot)),
            )

    def get(self, peer_id: str) -> Optional[dict]:
        if self._db_path is None:
            return self._peers.get(peer_id)
        with self._lock, self._conn() as conn:
            row = conn.execute(
                "SELECT info FROM peers WHERE peer_id = ?", (peer_id,)
            ).fetchone()
        if row is None:
            return None
        try:
            return json.loads(row[0])
        except (TypeError, ValueError, json.JSONDecodeError):
            return None

    def list(self) -> List[dict]:
        if self._db_path is None:
            return list(self._peers.values())
        with self._lock, self._conn() as conn:
            rows = conn.execute("SELECT info FROM peers").fetchall()
        out = []
        for (m,) in rows:
            try:
                out.append(json.loads(m))
            except (TypeError, ValueError, json.JSONDecodeError):
                continue
        return out

    def remove(self, peer_id: str) -> bool:
        if self._db_path is None:
            with self._lock:
                if peer_id not in self._peers:
                    return False
                del self._peers[peer_id]
                return True
        with self._lock, self._conn() as conn:
            cur = conn.execute("DELETE FROM peers WHERE peer_id = ?", (peer_id,))
            return cur.rowcount > 0

    def count(self) -> int:
        if self._db_path is None:
            return len(self._peers)
        with self._lock, self._conn() as conn:
            row = conn.execute("SELECT COUNT(*) FROM peers").fetchone()
        return int(row[0])
