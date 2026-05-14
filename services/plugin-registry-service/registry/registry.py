"""W6-T16b — Plugin registry singletons.

`PLUGIN_REGISTRY_DB_PATH` (env) → persistent SQLite backend.
Unset → in-memory only (test default + backward-compat).
"""
import os
from pathlib import Path

from .plugin_registry import PluginRegistry
from .hook_dispatcher import HookDispatcher

_DB_PATH_ENV = os.getenv("PLUGIN_REGISTRY_DB_PATH", "").strip()
_db_path = Path(_DB_PATH_ENV) if _DB_PATH_ENV else None

plugin_registry = PluginRegistry(db_path=_db_path)
hook_dispatcher = HookDispatcher(plugin_registry)
