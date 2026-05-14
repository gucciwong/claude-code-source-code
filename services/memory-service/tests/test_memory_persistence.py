"""W6-T16 — restart-survives test for MemoryStore SQLite backend.

The legacy `test_memory_store.py` covers the in-memory mode (default
constructor). This file covers the new persistent mode.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from memory.memory_store import MemoryStore


def test_persistent_round_trip_survives_restart(tmp_path: Path) -> None:
    db = tmp_path / "memory.db"

    # Session 1: write
    store1 = MemoryStore(db_path=db)
    a = store1.add("python is a great language", tags=["lang"])
    b = store1.add("rust has strong type safety", tags=["lang"])
    assert store1.count() == 2

    # Session 2: fresh instance, same file
    store2 = MemoryStore(db_path=db)
    assert store2.count() == 2
    all_mems = store2.list()
    ids = {m["id"] for m in all_mems}
    assert {a["id"], b["id"]} == ids
    # Tag preservation
    assert {m["text"] for m in all_mems} == {
        "python is a great language",
        "rust has strong type safety",
    }
    for m in all_mems:
        assert m["tags"] == ["lang"]


def test_persistent_search_uses_correct_doc_freq_after_reload(tmp_path: Path) -> None:
    db = tmp_path / "memory.db"
    store1 = MemoryStore(db_path=db)
    store1.add("python language python")
    store1.add("rust safety rust")
    store1.add("language semantics")

    # Reload — doc_freq must be rebuilt from disk for TF-IDF to score correctly.
    store2 = MemoryStore(db_path=db)
    results = store2.search("python")
    # The memory about python should rank highest
    assert results[0]["memory"]["text"] == "python language python"


def test_persistent_remove_persists_to_disk(tmp_path: Path) -> None:
    db = tmp_path / "memory.db"
    store1 = MemoryStore(db_path=db)
    m = store1.add("temporary memory")
    assert store1.count() == 1
    assert store1.remove(m["id"]) is True

    store2 = MemoryStore(db_path=db)
    assert store2.count() == 0


def test_persistent_clear_wipes_disk_state(tmp_path: Path) -> None:
    db = tmp_path / "memory.db"
    store1 = MemoryStore(db_path=db)
    store1.add("a"); store1.add("b"); store1.add("c")
    assert store1.count() == 3
    store1.clear()
    assert store1.count() == 0

    store2 = MemoryStore(db_path=db)
    assert store2.count() == 0


def test_in_memory_mode_unchanged(tmp_path: Path) -> None:
    """Default constructor must behave exactly like the legacy implementation."""
    store = MemoryStore()  # no db_path
    a = store.add("alpha")
    b = store.add("beta")
    assert store.count() == 2
    assert store.remove(a["id"]) is True
    assert store.count() == 1
    assert store.list()[0]["id"] == b["id"]


def test_persistent_default_search_returns_top_k_when_query_empty(tmp_path: Path) -> None:
    db = tmp_path / "memory.db"
    store = MemoryStore(db_path=db)
    for i in range(7):
        store.add(f"memory-{i}")
    # An empty query short-circuits to "first top_k"
    out = store.search("...", top_k=3)
    assert len(out) <= 3
    # Each result still has memory + score keys
    for r in out:
        assert "memory" in r and "score" in r


def test_persistent_handles_missing_directory(tmp_path: Path) -> None:
    """db_path parent dir is created if missing."""
    db = tmp_path / "deep" / "nested" / "path" / "memory.db"
    store = MemoryStore(db_path=db)
    store.add("creates the directory")
    assert db.exists()
    assert db.parent.exists()
