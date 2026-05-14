"""W6-T16b — Plugin registry with optional SQLite persistence.

Same backward-compat contract as `memory-service`'s MemoryStore: no
constructor argument → process-local dict (legacy tests untouched);
`db_path=<path>` → SQLite WAL-backed table that survives restarts.

Manifest is stored as a single JSON column to avoid schema churn when new
plugin fields are added — we never query inside the manifest.
"""

from __future__ import annotations

import json
import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Dict, Iterator, List, Optional


_SCHEMA = """
CREATE TABLE IF NOT EXISTS plugins (
    id        TEXT PRIMARY KEY,
    manifest  TEXT NOT NULL
);
"""


class PluginRegistry:
    def __init__(self, db_path: Optional[Path | str] = None) -> None:
        self._db_path: Optional[Path] = Path(db_path) if db_path else None
        self._lock = threading.Lock()
        self._plugins: Dict[str, dict] = {}

        if self._db_path is not None:
            self._db_path.parent.mkdir(parents=True, exist_ok=True)
            self._init_schema()

    # ------------------------------------------------------------------
    # SQLite helpers
    # ------------------------------------------------------------------

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        if self._db_path is None:
            raise RuntimeError("plugin registry: db_path is None — caller bug")
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

    def _load(self, plugin_id: str) -> Optional[dict]:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT manifest FROM plugins WHERE id = ?", (plugin_id,)
            ).fetchone()
        if row is None:
            return None
        try:
            return json.loads(row[0])
        except (TypeError, ValueError, json.JSONDecodeError):
            return None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def register(self, manifest: dict) -> None:
        plugin_id = manifest["id"]
        snapshot = dict(manifest)
        if self._db_path is None:
            with self._lock:
                self._plugins[plugin_id] = snapshot
            return
        with self._lock, self._conn() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO plugins (id, manifest) VALUES (?, ?)",
                (plugin_id, json.dumps(snapshot)),
            )

    def get(self, plugin_id: str) -> Optional[dict]:
        if self._db_path is None:
            return self._plugins.get(plugin_id)
        return self._load(plugin_id)

    def list(self) -> List[dict]:
        if self._db_path is None:
            return list(self._plugins.values())
        with self._lock, self._conn() as conn:
            rows = conn.execute("SELECT manifest FROM plugins").fetchall()
        out = []
        for (m,) in rows:
            try:
                out.append(json.loads(m))
            except (TypeError, ValueError, json.JSONDecodeError):
                continue
        return out

    def remove(self, plugin_id: str) -> bool:
        if self._db_path is None:
            with self._lock:
                if plugin_id not in self._plugins:
                    return False
                del self._plugins[plugin_id]
                return True
        with self._lock, self._conn() as conn:
            cur = conn.execute("DELETE FROM plugins WHERE id = ?", (plugin_id,))
            return cur.rowcount > 0

    def set_enabled(self, plugin_id: str, enabled: bool) -> bool:
        if self._db_path is None:
            with self._lock:
                if plugin_id not in self._plugins:
                    return False
                self._plugins[plugin_id]["enabled"] = enabled
                return True
        with self._lock:
            current = self._load(plugin_id)
            if current is None:
                return False
            current["enabled"] = enabled
            with self._conn() as conn:
                conn.execute(
                    "UPDATE plugins SET manifest = ? WHERE id = ?",
                    (json.dumps(current), plugin_id),
                )
            return True

    def get_plugins_for_hook(self, hook: str) -> List[dict]:
        return [
            p
            for p in self.list()
            if p.get("enabled", True) and hook in p.get("hooks", [])
        ]

    def count(self) -> int:
        if self._db_path is None:
            return len(self._plugins)
        with self._lock, self._conn() as conn:
            row = conn.execute("SELECT COUNT(*) FROM plugins").fetchone()
        return int(row[0])
