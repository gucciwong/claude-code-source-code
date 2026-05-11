"""Tests for services/_shared/auth.py.

Run from repo root:
    pytest services/_shared/tests -q

These tests construct a tiny FastAPI app per case and exercise it via
`fastapi.testclient.TestClient` to verify the dependency end-to-end.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from services._shared import auth as auth_module
from services._shared.auth import (
    ENV_DISABLED,
    ENV_TOKEN,
    ENV_TOKEN_FILE,
    reset_dev_warning_for_tests,
    verify_local_token,
)


# ---------------------------------------------------------------------------
# Test fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch: pytest.MonkeyPatch):
    """Ensure auth-related env vars are unset before each test."""
    for var in (ENV_TOKEN, ENV_TOKEN_FILE, ENV_DISABLED):
        monkeypatch.delenv(var, raising=False)
    reset_dev_warning_for_tests()
    yield


@pytest.fixture
def client_factory():
    """Build a fresh FastAPI app + client; one protected route."""

    def _build() -> TestClient:
        app = FastAPI()

        @app.get("/secret")
        async def secret(token: str = Depends(verify_local_token)) -> dict:
            return {"token_seen": token}

        return TestClient(app, raise_server_exceptions=False)

    return _build


# ---------------------------------------------------------------------------
# Cases — missing / malformed credentials
# ---------------------------------------------------------------------------


def test_missing_authorization_header_returns_401(client_factory, monkeypatch):
    monkeypatch.setenv(ENV_TOKEN, "expected-secret")
    client = client_factory()

    resp = client.get("/secret")

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Missing Authorization header"
    assert resp.headers.get("www-authenticate", "").lower().startswith("bearer")


def test_wrong_scheme_returns_401(client_factory, monkeypatch):
    monkeypatch.setenv(ENV_TOKEN, "expected-secret")
    client = client_factory()

    resp = client.get(
        "/secret",
        headers={"Authorization": "Basic dXNlcjpwYXNz"},
    )

    assert resp.status_code == 401
    assert "Bearer" in resp.json()["detail"] or "scheme" in resp.json()["detail"]


def test_wrong_token_returns_401(client_factory, monkeypatch):
    monkeypatch.setenv(ENV_TOKEN, "expected-secret")
    client = client_factory()

    resp = client.get(
        "/secret",
        headers={"Authorization": "Bearer not-the-right-one"},
    )

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid local token"


# ---------------------------------------------------------------------------
# Cases — happy path via env + file
# ---------------------------------------------------------------------------


def test_correct_env_token_returns_200(client_factory, monkeypatch):
    monkeypatch.setenv(ENV_TOKEN, "expected-secret")
    client = client_factory()

    resp = client.get(
        "/secret",
        headers={"Authorization": "Bearer expected-secret"},
    )

    assert resp.status_code == 200
    assert resp.json() == {"token_seen": "expected-secret"}


def test_correct_file_token_returns_200(client_factory, monkeypatch, tmp_path: Path):
    token_file = tmp_path / "local.token"
    token_file.write_text("file-secret\n", encoding="utf-8")  # trailing newline on purpose
    monkeypatch.setenv(ENV_TOKEN_FILE, str(token_file))

    client = client_factory()

    resp = client.get(
        "/secret",
        headers={"Authorization": "Bearer file-secret"},
    )

    assert resp.status_code == 200
    assert resp.json() == {"token_seen": "file-secret"}


def test_env_token_overrides_file_token(client_factory, monkeypatch, tmp_path: Path):
    """If both env and file are set, env wins (env is the more explicit signal)."""
    token_file = tmp_path / "local.token"
    token_file.write_text("file-secret", encoding="utf-8")
    monkeypatch.setenv(ENV_TOKEN_FILE, str(token_file))
    monkeypatch.setenv(ENV_TOKEN, "env-secret")

    client = client_factory()

    # Presenting the file token should fail because env wins.
    bad = client.get(
        "/secret",
        headers={"Authorization": "Bearer file-secret"},
    )
    assert bad.status_code == 401

    # Presenting the env token should succeed.
    good = client.get(
        "/secret",
        headers={"Authorization": "Bearer env-secret"},
    )
    assert good.status_code == 200


# ---------------------------------------------------------------------------
# Cases — misconfiguration
# ---------------------------------------------------------------------------


def test_no_token_configured_fails_closed(client_factory, monkeypatch, tmp_path: Path):
    """If server has no env and no file, even valid-looking requests get 401."""
    # Point token file at a path that doesn't exist.
    monkeypatch.setenv(ENV_TOKEN_FILE, str(tmp_path / "does-not-exist"))

    client = client_factory()

    resp = client.get(
        "/secret",
        headers={"Authorization": "Bearer anything"},
    )

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Server has no local token configured"


def test_empty_token_file_is_treated_as_unconfigured(
    client_factory, monkeypatch, tmp_path: Path
):
    token_file = tmp_path / "local.token"
    token_file.write_text("   \n\t  \n", encoding="utf-8")  # whitespace only
    monkeypatch.setenv(ENV_TOKEN_FILE, str(token_file))

    client = client_factory()

    resp = client.get(
        "/secret",
        headers={"Authorization": "Bearer whatever"},
    )

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Server has no local token configured"


# ---------------------------------------------------------------------------
# Cases — dev bypass
# ---------------------------------------------------------------------------


def test_dev_disabled_allows_unauthenticated_calls(client_factory, monkeypatch, caplog):
    monkeypatch.setenv(ENV_DISABLED, "1")
    # Intentionally no ENV_TOKEN set.
    client = client_factory()

    with caplog.at_level("WARNING", logger=auth_module.logger.name):
        resp = client.get("/secret")

    assert resp.status_code == 200
    assert resp.json() == {"token_seen": ""}
    # Warning must be emitted at least once.
    assert any("DISABLED" in rec.message for rec in caplog.records)


def test_dev_disabled_warning_emits_only_once(client_factory, monkeypatch, caplog):
    monkeypatch.setenv(ENV_DISABLED, "1")
    client = client_factory()

    with caplog.at_level("WARNING", logger=auth_module.logger.name):
        client.get("/secret")
        client.get("/secret")
        client.get("/secret")

    disabled_warnings = [rec for rec in caplog.records if "DISABLED" in rec.message]
    assert len(disabled_warnings) == 1


# ---------------------------------------------------------------------------
# Cases — constant-time compare smoke
# ---------------------------------------------------------------------------


def test_uses_constant_time_compare(monkeypatch):
    """Smoke test: verify we wired through hmac.compare_digest (not ==).

    We can't reliably measure timing in unit tests, but we can ensure that
    the code path uses hmac.compare_digest by patching it and asserting
    the call happened.
    """
    monkeypatch.setenv(ENV_TOKEN, "abc")

    called = {"count": 0}
    real_compare = auth_module.hmac.compare_digest

    def spy(a, b):
        called["count"] += 1
        return real_compare(a, b)

    monkeypatch.setattr(auth_module.hmac, "compare_digest", spy)

    app = FastAPI()

    @app.get("/secret")
    async def secret(token: str = Depends(verify_local_token)) -> dict:
        return {"ok": True}

    client = TestClient(app, raise_server_exceptions=False)

    client.get("/secret", headers={"Authorization": "Bearer abc"})
    client.get("/secret", headers={"Authorization": "Bearer wrong"})

    assert called["count"] >= 2, "hmac.compare_digest must be called per request"
