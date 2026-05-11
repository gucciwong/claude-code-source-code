"""W6-T16b — restart-survives test for PeerRegistry SQLite backend."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from federation.peer_registry import PeerRegistry


def _peer(peer_id: str, **extra) -> dict:
    base = {
        "peer_id": peer_id,
        "address": f"http://peer-{peer_id}.local:9100",
        "data_size": 1000,
    }
    base.update(extra)
    return base


def test_persistent_round_trip_survives_restart(tmp_path: Path) -> None:
    db = tmp_path / "peers.db"
    s1 = PeerRegistry(db_path=db)
    s1.register(_peer("alice"))
    s1.register(_peer("bob"))
    assert s1.count() == 2

    s2 = PeerRegistry(db_path=db)
    assert s2.count() == 2
    alice = s2.get("alice")
    assert alice is not None
    assert alice["address"] == "http://peer-alice.local:9100"


def test_register_with_same_id_overwrites(tmp_path: Path) -> None:
    db = tmp_path / "peers.db"
    s = PeerRegistry(db_path=db)
    s.register(_peer("alice", data_size=100))
    s.register(_peer("alice", data_size=999))
    assert s.count() == 1
    assert s.get("alice")["data_size"] == 999


def test_remove_persists(tmp_path: Path) -> None:
    db = tmp_path / "peers.db"
    s1 = PeerRegistry(db_path=db)
    s1.register(_peer("alice"))
    assert s1.remove("alice") is True

    s2 = PeerRegistry(db_path=db)
    assert s2.count() == 0


def test_remove_unknown_returns_false(tmp_path: Path) -> None:
    db = tmp_path / "peers.db"
    s = PeerRegistry(db_path=db)
    assert s.remove("ghost") is False


def test_list_returns_all_peers(tmp_path: Path) -> None:
    db = tmp_path / "peers.db"
    s = PeerRegistry(db_path=db)
    s.register(_peer("a"))
    s.register(_peer("b"))
    s.register(_peer("c"))
    ids = {p["peer_id"] for p in s.list()}
    assert ids == {"a", "b", "c"}


def test_in_memory_mode_unchanged() -> None:
    s = PeerRegistry()
    s.register(_peer("alice"))
    s.register(_peer("bob"))
    assert s.count() == 2
    assert s.remove("alice") is True
    assert s.count() == 1


def test_unknown_peer_returns_none(tmp_path: Path) -> None:
    db = tmp_path / "peers.db"
    s = PeerRegistry(db_path=db)
    s.register(_peer("alice"))
    assert s.get("ghost") is None
