"""W3-T8d: training-service export and cleanup routes require local token.

Run from repo root:
    cd services/training-service && pytest tests/test_auth_guards.py -q

Notes
-----
The service initialises a SQLite DB at import time. To keep the test
self-contained we point `DB_PATH` at a per-test temp file via monkeypatch
BEFORE importing `main`, then drop it from sys.modules so it re-imports.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

_HERE = Path(__file__).resolve().parent
_SERVICE_ROOT = _HERE.parent
_SERVICES_DIR = _SERVICE_ROOT.parent
for p in (str(_SERVICE_ROOT), str(_SERVICES_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient  # noqa: E402

from _shared.auth import (  # noqa: E402
    ENV_DISABLED,
    ENV_TOKEN,
    ENV_TOKEN_FILE,
    reset_dev_warning_for_tests,
)

VALID_TOKEN = "training-service-test-token-32-bytes-abcdef"


@pytest.fixture(autouse=True)
def _isolated_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    for var in (ENV_TOKEN, ENV_TOKEN_FILE, ENV_DISABLED):
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setenv(ENV_TOKEN, VALID_TOKEN)
    # Isolate DB so this test never touches real training data.
    db_file = tmp_path / "training.db"
    monkeypatch.setenv("DB_PATH", str(db_file))
    monkeypatch.setenv("EXPERIMENTS_DB_DIR", str(tmp_path))
    monkeypatch.setenv("RESEARCH_PROGRAMS_DB_DIR", str(tmp_path))
    reset_dev_warning_for_tests()
    yield


@pytest.fixture
def client(_isolated_env) -> TestClient:
    sys.modules.pop("main", None)
    import main as svc_main  # noqa: F401
    return TestClient(svc_main.app)


# ---------------------------------------------------------------------------
# Guarded routes — 401 without token
# ---------------------------------------------------------------------------


def test_export_without_token_returns_401(client: TestClient) -> None:
    resp = client.get("/api/v1/training/export?format=jsonlines&max_samples=10")
    assert resp.status_code == 401, resp.text
    assert resp.headers.get("www-authenticate", "").lower().startswith("bearer")


def test_cleanup_without_token_returns_401(client: TestClient) -> None:
    resp = client.post("/api/v1/training/cleanup?days_old=90")
    assert resp.status_code == 401, resp.text


# ---------------------------------------------------------------------------
# Same routes pass auth with a valid token
# ---------------------------------------------------------------------------


def test_export_with_valid_token_is_not_401(client: TestClient) -> None:
    resp = client.get(
        "/api/v1/training/export?format=jsonlines&max_samples=10",
        headers={"Authorization": f"Bearer {VALID_TOKEN}"},
    )
    assert resp.status_code != 401, resp.text


def test_cleanup_with_valid_token_is_not_401(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/training/cleanup?days_old=90",
        headers={"Authorization": f"Bearer {VALID_TOKEN}"},
    )
    assert resp.status_code != 401, resp.text


# ---------------------------------------------------------------------------
# /health must stay open
# ---------------------------------------------------------------------------


def test_health_endpoint_is_open(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Unprotected write/read endpoints remain unprotected (regression guard)
# ---------------------------------------------------------------------------


def test_training_status_is_open(client: TestClient) -> None:
    """Status is read-only and high-frequency; intentionally NOT guarded."""
    resp = client.get("/api/v1/training/status")
    assert resp.status_code == 200
