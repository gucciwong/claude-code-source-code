import pytest
from federation.round_manager import FederationRoundManager


@pytest.fixture
def manager():
    return FederationRoundManager()


PEER_A = {"peer_id": "pA", "address": "localhost:5001", "data_size": 100}
PEER_B = {"peer_id": "pB", "address": "localhost:5002", "data_size": 200}


def test_start_round_creates_round_with_participating_peers(manager):
    peers = [PEER_A, PEER_B]
    result = manager.start_round(peers)
    assert "round_id" in result
    assert "pA" in result["participating_peers"]
    assert "pB" in result["participating_peers"]
    assert result["status"] == "collecting"


def test_submit_update_adds_update_to_round(manager):
    peers = [PEER_A]
    round_obj = manager.start_round(peers)
    update = {
        "peer_id": "pA",
        "round_id": round_obj["round_id"],
        "gradients": [0.1, 0.2],
        "data_size": 100,
    }
    result = manager.submit_update(update)
    assert result is not None
    assert "pA" in result["submitted_peers"]


def test_submit_update_returns_none_for_unknown_round(manager):
    update = {
        "peer_id": "pA",
        "round_id": "nonexistent-round-id",
        "gradients": [0.1],
        "data_size": 100,
    }
    result = manager.submit_update(update)
    assert result is None


def test_round_auto_finalizes_when_all_peers_submit(manager):
    peers = [PEER_A, PEER_B]
    round_obj = manager.start_round(peers)
    rid = round_obj["round_id"]

    manager.submit_update({"peer_id": "pA", "round_id": rid, "gradients": [1.0, 2.0], "data_size": 100})
    result = manager.submit_update({"peer_id": "pB", "round_id": rid, "gradients": [3.0, 4.0], "data_size": 200})

    assert result["status"] == "complete"
    assert result["aggregated_gradients"] is not None
    assert len(result["aggregated_gradients"]) == 2


def test_history_returns_list_of_rounds(manager):
    peers = [PEER_A]
    round_obj = manager.start_round(peers)
    rid = round_obj["round_id"]
    manager.submit_update({"peer_id": "pA", "round_id": rid, "gradients": [1.0], "data_size": 100})

    history = manager.history()
    assert isinstance(history, list)
    assert len(history) >= 1
