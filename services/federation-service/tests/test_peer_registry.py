import pytest
from federation.peer_registry import PeerRegistry


@pytest.fixture
def registry():
    return PeerRegistry()


def test_register_adds_peer(registry):
    registry.register({"peer_id": "p1", "address": "localhost:5001", "data_size": 100})
    assert registry.count() == 1


def test_get_returns_peer_by_id(registry):
    registry.register({"peer_id": "p1", "address": "localhost:5001", "data_size": 100})
    peer = registry.get("p1")
    assert peer is not None
    assert peer["peer_id"] == "p1"
    assert peer["address"] == "localhost:5001"


def test_get_returns_none_for_unknown_peer(registry):
    result = registry.get("unknown")
    assert result is None


def test_remove_returns_true_and_deletes_peer(registry):
    registry.register({"peer_id": "p1", "address": "localhost:5001", "data_size": 100})
    result = registry.remove("p1")
    assert result is True
    assert registry.count() == 0


def test_remove_returns_false_for_unknown_peer(registry):
    result = registry.remove("does_not_exist")
    assert result is False


def test_count_returns_number_of_peers(registry):
    assert registry.count() == 0
    registry.register({"peer_id": "p1", "address": "a", "data_size": 50})
    registry.register({"peer_id": "p2", "address": "b", "data_size": 80})
    assert registry.count() == 2
