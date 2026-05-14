"""W6-T16b — restart-survives test for PluginRegistry SQLite backend."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from registry.plugin_registry import PluginRegistry


def _manifest(plugin_id: str, **extra) -> dict:
    base = {
        "id": plugin_id,
        "name": f"Plugin {plugin_id}",
        "version": "1.0.0",
        "hooks": ["on_save"],
        "enabled": True,
    }
    base.update(extra)
    return base


def test_persistent_round_trip_survives_restart(tmp_path: Path) -> None:
    db = tmp_path / "plugins.db"
    s1 = PluginRegistry(db_path=db)
    s1.register(_manifest("alpha"))
    s1.register(_manifest("beta", enabled=False))
    assert s1.count() == 2

    s2 = PluginRegistry(db_path=db)
    assert s2.count() == 2
    alpha = s2.get("alpha")
    beta = s2.get("beta")
    assert alpha is not None and alpha["name"] == "Plugin alpha"
    assert beta is not None and beta["enabled"] is False


def test_set_enabled_persists(tmp_path: Path) -> None:
    db = tmp_path / "plugins.db"
    s1 = PluginRegistry(db_path=db)
    s1.register(_manifest("alpha"))
    assert s1.set_enabled("alpha", False) is True

    s2 = PluginRegistry(db_path=db)
    assert s2.get("alpha")["enabled"] is False


def test_set_enabled_unknown_returns_false(tmp_path: Path) -> None:
    db = tmp_path / "plugins.db"
    s = PluginRegistry(db_path=db)
    assert s.set_enabled("ghost", True) is False


def test_remove_persists(tmp_path: Path) -> None:
    db = tmp_path / "plugins.db"
    s1 = PluginRegistry(db_path=db)
    s1.register(_manifest("alpha"))
    assert s1.remove("alpha") is True

    s2 = PluginRegistry(db_path=db)
    assert s2.count() == 0


def test_get_plugins_for_hook_filters_enabled(tmp_path: Path) -> None:
    db = tmp_path / "plugins.db"
    s = PluginRegistry(db_path=db)
    s.register(_manifest("alpha", hooks=["on_save"], enabled=True))
    s.register(_manifest("beta",  hooks=["on_save"], enabled=False))
    s.register(_manifest("gamma", hooks=["on_load"], enabled=True))

    hits = s.get_plugins_for_hook("on_save")
    ids = {h["id"] for h in hits}
    assert ids == {"alpha"}


def test_in_memory_mode_unchanged() -> None:
    s = PluginRegistry()  # no db_path
    s.register(_manifest("alpha"))
    s.register(_manifest("beta"))
    assert s.count() == 2
    assert s.remove("alpha") is True
    assert s.count() == 1


def test_register_with_same_id_overwrites(tmp_path: Path) -> None:
    db = tmp_path / "plugins.db"
    s = PluginRegistry(db_path=db)
    s.register(_manifest("alpha", version="1.0.0"))
    s.register(_manifest("alpha", version="2.0.0"))
    assert s.count() == 1
    assert s.get("alpha")["version"] == "2.0.0"
