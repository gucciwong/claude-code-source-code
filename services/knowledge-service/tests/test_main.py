"""Pytest tests for the knowledge service.

The sentence-transformers model is mocked with a fake that always returns [0.1, 0.2, 0.3]
so no model download is required.
"""

import math
import importlib
import sys
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Fake SentenceTransformer that returns a fixed embedding
# ---------------------------------------------------------------------------

FIXED_EMBEDDING = [0.1, 0.2, 0.3]


class FakeSentenceTransformer:
    """Drop-in replacement for SentenceTransformer that returns a constant vector."""

    def __init__(self, model_name: str, device: str = "cpu") -> None:
        self.model_name = model_name
        self.device = device

    def encode(self, text: str, convert_to_numpy: bool = True):  # noqa: ANN001
        """Return a numpy-like object with .tolist()."""
        mock_array = MagicMock()
        mock_array.tolist.return_value = list(FIXED_EMBEDDING)
        return mock_array


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def client():
    """Fresh TestClient with the model patched and module state reset."""
    # Patch the import inside main.py before each test
    fake_module = MagicMock()
    fake_module.SentenceTransformer = FakeSentenceTransformer

    with patch.dict("sys.modules", {"sentence_transformers": fake_module}):
        # Reload main so the global _model / _model_loaded are reset
        if "main" in sys.modules:
            del sys.modules["main"]
        import main as app_module  # noqa: PLC0415

        # Reset lazy-load state for each test
        app_module._model = None
        app_module._model_loaded = False

        yield TestClient(app_module.app), app_module


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

# 1. GET /health returns 200
def test_health_returns_200(client):
    tc, _ = client
    resp = tc.get("/health")
    assert resp.status_code == 200


# 2. GET /health returns "ok" status
def test_health_status_ok(client):
    tc, _ = client
    resp = tc.get("/health")
    assert resp.json()["status"] == "ok"


# 3. POST /embed with valid text returns embedding field
def test_embed_returns_embedding(client):
    tc, _ = client
    resp = tc.post("/embed", json={"text": "hello world"})
    assert resp.status_code == 200
    assert "embedding" in resp.json()


# 4. POST /embed embedding is a list of floats
def test_embed_returns_list_of_floats(client):
    tc, _ = client
    resp = tc.post("/embed", json={"text": "test"})
    embedding = resp.json()["embedding"]
    assert isinstance(embedding, list)
    assert all(isinstance(v, (int, float)) for v in embedding)


# 5. POST /embed dim > 0
def test_embed_dim_positive(client):
    tc, _ = client
    resp = tc.post("/embed", json={"text": "check dim"})
    data = resp.json()
    assert data["dim"] > 0
    assert data["dim"] == len(data["embedding"])


# 6. POST /embed with empty text returns 400
def test_embed_empty_text_returns_400(client):
    tc, _ = client
    resp = tc.post("/embed", json={"text": ""})
    assert resp.status_code == 400


# 7. POST /search returns results array
def test_search_returns_results(client):
    tc, mod = client
    # Embed first so model is loaded
    tc.post("/embed", json={"text": "init"})
    qe = FIXED_EMBEDDING
    snippets = [{"id": "s1", "embedding": FIXED_EMBEDDING}]
    resp = tc.post("/search", json={"query_embedding": qe, "snippets": snippets, "top_k": 5, "threshold": 0.0})
    assert resp.status_code == 200
    assert "results" in resp.json()


# 8. POST /search with top_k=1 returns at most 1 result
def test_search_top_k_respected(client):
    tc, _ = client
    qe = FIXED_EMBEDDING
    snippets = [
        {"id": "a", "embedding": [0.1, 0.2, 0.3]},
        {"id": "b", "embedding": [0.9, 0.1, 0.0]},
        {"id": "c", "embedding": [0.0, 0.0, 1.0]},
    ]
    resp = tc.post("/search", json={"query_embedding": qe, "snippets": snippets, "top_k": 1, "threshold": 0.0})
    assert len(resp.json()["results"]) <= 1


# 9. POST /search applies threshold
def test_search_threshold_filters(client):
    tc, _ = client
    qe = [1.0, 0.0, 0.0]
    # snippet perpendicular to query → similarity = 0
    snippets = [{"id": "x", "embedding": [0.0, 1.0, 0.0]}]
    resp = tc.post("/search", json={"query_embedding": qe, "snippets": snippets, "top_k": 5, "threshold": 0.5})
    assert resp.json()["results"] == []


# 10. POST /search with empty snippets returns empty results
def test_search_empty_snippets(client):
    tc, _ = client
    resp = tc.post("/search", json={"query_embedding": FIXED_EMBEDDING, "snippets": [], "top_k": 5, "threshold": 0.0})
    assert resp.json()["results"] == []


# 11. POST /search results sorted by score descending
def test_search_sorted_descending(client):
    tc, _ = client
    qe = [1.0, 0.0, 0.0]
    snippets = [
        {"id": "low",  "embedding": [0.5, 0.5, 0.0]},   # lower similarity
        {"id": "high", "embedding": [1.0, 0.0, 0.0]},   # similarity = 1.0
        {"id": "mid",  "embedding": [0.9, 0.1, 0.0]},
    ]
    resp = tc.post("/search", json={"query_embedding": qe, "snippets": snippets, "top_k": 3, "threshold": 0.0})
    scores = [h["score"] for h in resp.json()["results"]]
    assert scores == sorted(scores, reverse=True)


# 12. POST /embed model_loaded becomes true after first embed
def test_model_loaded_after_embed(client):
    tc, mod = client
    assert mod._model_loaded is False
    tc.post("/embed", json={"text": "trigger load"})
    assert mod._model_loaded is True


# 13. GET /health model_loaded is false before any embed
def test_health_model_loaded_false_initially(client):
    tc, _ = client
    resp = tc.get("/health")
    assert resp.json()["model_loaded"] is False


# 14. POST /search cosine similarity computed correctly for known vectors
def test_search_cosine_correct(client):
    tc, _ = client
    qe = [1.0, 0.0, 0.0]
    vec_b = [1.0, 0.0, 0.0]  # identical → similarity 1.0
    resp = tc.post("/search", json={"query_embedding": qe, "snippets": [{"id": "id1", "embedding": vec_b}], "top_k": 5, "threshold": 0.0})
    result = resp.json()["results"][0]
    assert abs(result["score"] - 1.0) < 1e-6


# 15. POST /search with threshold=1.0 returns empty when similarity < 1.0
def test_search_impossible_threshold(client):
    tc, _ = client
    qe = [1.0, 0.0, 0.0]
    # Slightly off → similarity < 1.0
    snippets = [{"id": "z", "embedding": [0.9, 0.1, 0.0]}]
    resp = tc.post("/search", json={"query_embedding": qe, "snippets": snippets, "top_k": 5, "threshold": 1.0})
    assert resp.json()["results"] == []
