"""W3-T8d: every enterprise-data route except /health requires the local token.

Run from repo root:
    cd services/enterprise-data-service && pytest tests/test_auth_guards.py -q
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

VALID_TOKEN = "enterprise-data-test-token-32-bytes-abcdef"


@pytest.fixture(autouse=True)
def _isolated_env(monkeypatch: pytest.MonkeyPatch):
    for var in (ENV_TOKEN, ENV_TOKEN_FILE, ENV_DISABLED):
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setenv(ENV_TOKEN, VALID_TOKEN)
    reset_dev_warning_for_tests()
    yield


@pytest.fixture
def client(_isolated_env) -> TestClient:
    sys.modules.pop("main", None)
    import main as svc_main  # noqa: F401
    return TestClient(svc_main.app)


# ---------------------------------------------------------------------------
# Sample of guarded routes — 401 without token
# ---------------------------------------------------------------------------


def test_list_connectors_without_token_returns_401(client: TestClient) -> None:
    resp = client.get("/connectors")
    assert resp.status_code == 401, resp.text
    assert resp.headers.get("www-authenticate", "").lower().startswith("bearer")


def test_audit_log_without_token_returns_401(client: TestClient) -> None:
    resp = client.get("/audit-log")
    assert resp.status_code == 401, resp.text


def test_ztla_scan_without_token_returns_401(client: TestClient) -> None:
    resp = client.post("/api/v1/ztla/scan", json={"text": "hello", "context": "test"})
    assert resp.status_code == 401, resp.text


# ---------------------------------------------------------------------------
# Same routes pass auth with a valid token
# ---------------------------------------------------------------------------


def test_list_connectors_with_valid_token_is_not_401(client: TestClient) -> None:
    resp = client.get(
        "/connectors",
        headers={"Authorization": f"Bearer {VALID_TOKEN}"},
    )
    assert resp.status_code != 401, resp.text
    # Empty registry → returns []
    assert resp.status_code == 200


def test_audit_log_with_valid_token_is_not_401(client: TestClient) -> None:
    resp = client.get(
        "/audit-log",
        headers={"Authorization": f"Bearer {VALID_TOKEN}"},
    )
    assert resp.status_code != 401, resp.text
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# /health must stay open (no token required)
# ---------------------------------------------------------------------------


def test_health_endpoint_is_open(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
