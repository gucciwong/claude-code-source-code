"""W3-T8d: model-manager mirror-switch and download-control routes require token.

Run from repo root:
    cd services/model-manager && pytest tests/test_auth_guards.py -q
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

VALID_TOKEN = "model-manager-test-token-32-bytes-abcdef"


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
# Guarded routes — 401 without token
# ---------------------------------------------------------------------------


def test_mirror_switch_without_token_returns_401(client: TestClient) -> None:
    resp = client.post("/api/v1/mirror/switch?mirror_name=huggingface")
    assert resp.status_code == 401, resp.text
    assert resp.headers.get("www-authenticate", "").lower().startswith("bearer")


def test_download_without_token_returns_401(client: TestClient) -> None:
    resp = client.post("/api/v1/models/openai-community/gpt2/download")
    assert resp.status_code == 401, resp.text


def test_download_cancel_without_token_returns_401(client: TestClient) -> None:
    resp = client.post("/api/v1/downloads/openai-community/gpt2/cancel")
    assert resp.status_code == 401, resp.text


# ---------------------------------------------------------------------------
# Same routes pass auth with valid token
# ---------------------------------------------------------------------------


def test_mirror_switch_with_valid_token_is_not_401(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/mirror/switch?mirror_name=huggingface",
        headers={"Authorization": f"Bearer {VALID_TOKEN}"},
    )
    assert resp.status_code != 401, resp.text
    # huggingface is a recognized mirror → should be 200
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Unprotected routes
# ---------------------------------------------------------------------------


def test_health_endpoint_is_open(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200


def test_mirror_info_get_is_open(client: TestClient) -> None:
    # The GET /api/v1/mirror endpoint is read-only and not protected.
    resp = client.get("/api/v1/mirror")
    assert resp.status_code == 200
