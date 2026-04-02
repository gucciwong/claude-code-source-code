import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_post_complete_with_prefix_returns_completions_list():
    response = client.post("/complete", json={"prefix": "def"})
    assert response.status_code == 200
    data = response.json()
    assert "completions" in data
    assert isinstance(data["completions"], list)


def test_post_complete_empty_prefix_returns_empty_completions():
    response = client.post("/complete", json={"prefix": ""})
    assert response.status_code == 200
    data = response.json()
    assert data["completions"] == []


def test_post_complete_max_results_respected():
    response = client.post("/complete", json={"prefix": "def", "max_results": 1})
    assert response.status_code == 200
    data = response.json()
    assert len(data["completions"]) <= 1


def test_post_feedback_accepted_true_returns_ok():
    response = client.post("/feedback", json={"completion": "function", "accepted": True})
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_post_feedback_accepted_false_returns_ok():
    response = client.post("/feedback", json={"completion": "function", "accepted": False})
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_completions_from_complete_have_text_and_confidence():
    response = client.post("/complete", json={"prefix": "def", "max_results": 3})
    assert response.status_code == 200
    completions = response.json()["completions"]
    for c in completions:
        assert "text" in c
        assert "confidence" in c


def test_complete_with_context_trains_engine_before_completing():
    context = "greet world greet world greet"
    response = client.post("/complete", json={"prefix": "greet", "context": context, "max_results": 3})
    assert response.status_code == 200
    completions = response.json()["completions"]
    texts = [c["text"] for c in completions]
    assert "world" in texts
