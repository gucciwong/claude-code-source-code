import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Reset singletons before each test by patching the registry
from memory.memory_store import MemoryStore
from memory.context_builder import ContextBuilder
import memory.registry as registry

from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def reset_store():
    """Reset the global memory store before each test."""
    registry.memory_store.clear()
    yield
    registry.memory_store.clear()


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def test_health_returns_ok(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"


def test_post_memories_adds_memory_and_returns_it_with_id(client):
    res = client.post("/memories", json={"text": "test memory", "tags": ["test"]})
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert data["text"] == "test memory"
    assert data["tags"] == ["test"]


def test_get_memories_returns_memories_list(client):
    client.post("/memories", json={"text": "memory one"})
    client.post("/memories", json={"text": "memory two"})
    res = client.get("/memories")
    assert res.status_code == 200
    data = res.json()
    assert "memories" in data
    assert data["count"] == 2


def test_get_memories_search_returns_results(client):
    client.post("/memories", json={"text": "python programming"})
    res = client.get("/memories/search?q=python")
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert "count" in data


def test_delete_memory_removes_it(client):
    add_res = client.post("/memories", json={"text": "to delete"})
    mem_id = add_res.json()["id"]
    del_res = client.delete(f"/memories/{mem_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "ok"
    list_res = client.get("/memories")
    assert list_res.json()["count"] == 0


def test_delete_unknown_memory_returns_404(client):
    res = client.delete("/memories/nonexistent-id-xyz")
    assert res.status_code == 404


def test_post_context_build_returns_compressed_context(client):
    client.post("/memories", json={"text": "machine learning with python"})
    res = client.post("/context/build", json={"query": "machine learning", "top_k": 5})
    assert res.status_code == 200
    data = res.json()
    assert "compressed_context" in data
    assert "query" in data
    assert "relevant_memories" in data
    assert "token_estimate" in data


def test_health_shows_memory_count(client):
    client.post("/memories", json={"text": "first"})
    client.post("/memories", json={"text": "second"})
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["memories"] == 2
