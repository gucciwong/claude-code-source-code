"""Tests for `_shared/logging.py` (W6-T18).

Covers:
  - JSON formatter shape
  - Request-id propagation across middleware → ContextVar → log line
  - Idempotent setup
"""
from __future__ import annotations

import io
import json
import logging
import re

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from services._shared.logging import (
    _JsonFormatter,
    current_request_id,
    install,
    setup_logging,
)


@pytest.fixture(autouse=True)
def _reset_root_logger():
    """Strip Sovereign handlers between tests so we don't leak state."""
    root = logging.getLogger()
    for h in list(root.handlers):
        if getattr(h, "_sovereign_handler", False):
            root.removeHandler(h)
    yield
    for h in list(root.handlers):
        if getattr(h, "_sovereign_handler", False):
            root.removeHandler(h)


def _capture_handler() -> tuple[logging.Handler, io.StringIO]:
    buf = io.StringIO()
    h = logging.StreamHandler(buf)
    h.setLevel("DEBUG")
    h.setFormatter(_JsonFormatter("svc"))
    return h, buf


# ---------------------------------------------------------------------------
# JSON formatter
# ---------------------------------------------------------------------------


def test_json_formatter_has_required_fields():
    h, buf = _capture_handler()
    logger = logging.getLogger("test1")
    logger.setLevel("INFO")
    logger.addHandler(h)
    logger.info("hello world")
    line = buf.getvalue().strip().splitlines()[-1]
    obj = json.loads(line)
    for k in ("ts", "level", "service", "logger", "msg"):
        assert k in obj, f"missing field {k!r}: {obj}"
    assert obj["level"] == "INFO"
    assert obj["service"] == "svc"
    assert obj["msg"] == "hello world"


def test_json_formatter_includes_extras():
    h, buf = _capture_handler()
    logger = logging.getLogger("test2")
    logger.setLevel("INFO")
    logger.addHandler(h)
    logger.info("ev", extra={"user_id": "u-1", "action": "click"})
    obj = json.loads(buf.getvalue().strip().splitlines()[-1])
    assert obj["user_id"] == "u-1"
    assert obj["action"] == "click"


def test_json_formatter_serialises_non_json_extras_safely():
    class Weird:
        def __repr__(self) -> str:
            return "<Weird>"

    h, buf = _capture_handler()
    logger = logging.getLogger("test3")
    logger.setLevel("INFO")
    logger.addHandler(h)
    logger.info("x", extra={"thing": Weird()})
    obj = json.loads(buf.getvalue().strip().splitlines()[-1])
    assert obj["thing"] == "<Weird>"


# ---------------------------------------------------------------------------
# setup_logging idempotence
# ---------------------------------------------------------------------------


def test_setup_logging_is_idempotent():
    setup_logging("svc")
    setup_logging("svc")
    setup_logging("svc")
    handlers = [h for h in logging.getLogger().handlers if getattr(h, "_sovereign_handler", False)]
    assert len(handlers) == 1


def test_setup_logging_honors_LOG_LEVEL(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("LOG_LEVEL", "WARNING")
    setup_logging("svc")
    assert logging.getLogger().level == logging.WARNING


# ---------------------------------------------------------------------------
# Request-id middleware
# ---------------------------------------------------------------------------


def test_request_id_generated_when_missing():
    app = FastAPI()
    install(app, "svc")

    @app.get("/who")
    async def who():
        return {"rid": current_request_id()}

    client = TestClient(app)
    resp = client.get("/who")
    assert resp.status_code == 200
    rid = resp.json()["rid"]
    assert isinstance(rid, str) and len(rid) >= 16
    assert resp.headers["X-Request-Id"] == rid


def test_request_id_propagated_from_inbound_header():
    app = FastAPI()
    install(app, "svc")
    seen = {}

    @app.get("/who")
    async def who():
        seen["rid"] = current_request_id()
        return {"rid": current_request_id()}

    client = TestClient(app)
    resp = client.get("/who", headers={"X-Request-Id": "abc-123"})
    assert resp.json()["rid"] == "abc-123"
    assert seen["rid"] == "abc-123"
    assert resp.headers["X-Request-Id"] == "abc-123"


def test_request_id_unique_per_request():
    app = FastAPI()
    install(app, "svc")
    ids = []

    @app.get("/who")
    async def who():
        ids.append(current_request_id())
        return {}

    client = TestClient(app)
    for _ in range(5):
        client.get("/who")
    assert len(set(ids)) == 5


def test_current_request_id_is_none_outside_a_request():
    assert current_request_id() is None


def test_log_line_includes_request_id_when_set():
    app = FastAPI()
    install(app, "svc")

    h, buf = _capture_handler()
    logging.getLogger().addHandler(h)

    @app.get("/log")
    async def log_endpoint():
        logging.getLogger("svc").info("inside-request")
        return {"ok": True}

    client = TestClient(app)
    client.get("/log", headers={"X-Request-Id": "trace-xyz"})

    lines = [ln for ln in buf.getvalue().splitlines() if "inside-request" in ln]
    assert lines, "expected at least one log line from the request handler"
    obj = json.loads(lines[-1])
    assert obj.get("request_id") == "trace-xyz"


def test_non_http_scope_passes_through():
    """The middleware must not interfere with lifespan / websocket frames."""
    app = FastAPI()
    install(app, "svc")
    # Trigger lifespan via TestClient
    with TestClient(app):
        pass
    # No exception = pass
