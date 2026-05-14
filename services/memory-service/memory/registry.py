"""W6-T16 — Memory service singletons.

`MEMORY_DB_PATH` (env) → persistent SQLite backend.
Unset → in-memory only (test default + backward-compat).
"""
import os
from pathlib import Path

from .memory_store import MemoryStore
from .context_builder import ContextBuilder

_DB_PATH_ENV = os.getenv("MEMORY_DB_PATH", "").strip()
_db_path = Path(_DB_PATH_ENV) if _DB_PATH_ENV else None

memory_store = MemoryStore(db_path=_db_path)
context_builder = ContextBuilder(memory_store)
