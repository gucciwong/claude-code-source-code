"""W3-T8d: prove that protected execution-trace routes reject calls without
a valid local token, accept calls with one, and that /health stays open.

Run from repo root:
    cd services/execution-trace-service && pytest tests/test_auth_guards.py -q
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Add both the service root (for relative imports like
# `execution_trace.python_runner`) and the services/ dir (for `_shared.auth`)
# to sys.path so this test file is runnable from any CWD.
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

VALID_TOKEN = "execution-trace-test-token-32-bytes-abcdef"


@pytest.fixture(autouse=True)
def _isolated_env(monkeypatch: pytest.MonkeyPatch):
    """Pin a known token, drop the file path override, ensure dev bypass off."""
    for var in (ENV_TOKEN, ENV_TOKEN_FILE, ENV_DISABLED):
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setenv(ENV_TOKEN, VALID_TOKEN)
    reset_dev_warning_for_tests()
    yield


@pytest.fixture
def client(_isolated_env) -> TestClient:
    # Force fresh import so the module-level path setup is executed under
    # the current env. Drop any cached main module first.
    sys.modules.pop("main", None)
    import main as svc_main  # noqa: F401  (imported for side effects)
    return TestClient(svc_main.app)


# ---------------------------------------------------------------------------
# Guarded routes — 401 without token, success with token
# ---------------------------------------------------------------------------


def test_trace_python_without_token_returns_401(client: TestClient) -> None:
    resp = client.post("/trace/python", json={"code": "x = 1", "timeout_ms": 1000})
    assert resp.status_code == 401, resp.text
    assert resp.headers.get("www-authenticate", "").lower().startswith("bearer")


def test_trace_python_with_valid_token_is_not_401(client: TestClient) -> None:
    resp = client.post(
        "/trace/python",
        json={"code": "x = 1", "timeout_ms": 1000},
        headers={"Authorization": f"Bearer {VALID_TOKEN}"},
    )
    assert resp.status_code != 401, resp.text


def test_bug_radar_analyze_without_token_returns_401(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/bug-radar/analyze",
        json={"code": "x = 1", "file_path": "x.py", "language": "python"},
    )
    assert resp.status_code == 401, resp.text


def test_cae_analyze_without_token_returns_401(client: TestClient) -> None:
    resp = client.post("/api/v1/cae/analyze", json={"commits": []})
    assert resp.status_code == 401, resp.text


# ---------------------------------------------------------------------------
# Unprotected routes — must stay open
# ---------------------------------------------------------------------------


def test_health_endpoint_is_open(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200


def test_cae_stats_is_open(client: TestClient) -> None:
    resp = client.get("/api/v1/cae/stats")
    assert resp.status_code == 200
