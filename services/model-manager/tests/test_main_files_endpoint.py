"""Integration-style tests for the GET /api/v1/models/{model_id}/files endpoint."""
from unittest.mock import patch, AsyncMock

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def _mock_files(files):
    return patch("main.downloader.list_all_files", new=AsyncMock(return_value=files))


# ── Happy path ────────────────────────────────────────────────────────────────

def test_list_model_files_returns_model_id_and_files():
    files = [{"path": "model.gguf", "size_bytes": 1000, "is_gguf": True}]
    with _mock_files(files):
        resp = client.get("/api/v1/models/user/repo/files")

    assert resp.status_code == 200
    data = resp.json()
    assert data["model_id"] == "user/repo"
    assert data["files"] == files


def test_list_model_files_preserves_slash_in_model_id():
    with _mock_files([]):
        resp = client.get("/api/v1/models/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/files")

    assert resp.status_code == 200
    assert resp.json()["model_id"] == "bartowski/Meta-Llama-3.1-8B-Instruct-GGUF"


def test_list_model_files_returns_empty_list_for_empty_repo():
    with _mock_files([]):
        resp = client.get("/api/v1/models/user/empty-repo/files")

    assert resp.status_code == 200
    assert resp.json()["files"] == []


def test_list_model_files_returns_multiple_files():
    files = [
        {"path": "model.Q4_K_M.gguf", "size_bytes": 4_000_000_000, "is_gguf": True},
        {"path": "model.Q8_0.gguf", "size_bytes": 7_500_000_000, "is_gguf": True},
        {"path": "README.md", "size_bytes": 1024, "is_gguf": False},
    ]
    with _mock_files(files):
        resp = client.get("/api/v1/models/user/repo/files")

    assert resp.status_code == 200
    assert len(resp.json()["files"]) == 3


# ── Error path ────────────────────────────────────────────────────────────────

def test_list_model_files_returns_502_on_exception():
    with patch("main.downloader.list_all_files", new=AsyncMock(side_effect=Exception("HF timeout"))):
        resp = client.get("/api/v1/models/user/bad-repo/files")

    assert resp.status_code == 502
    assert "HuggingFace API error" in resp.json()["detail"]
