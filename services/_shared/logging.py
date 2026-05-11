"""W6-T18 — Shared structured logging + request-id propagation.

Goal: every log line emitted by every service is JSON, tagged with the
service name, and carries the inbound `X-Request-Id` so a single user
action can be traced across Chat → model-manager → training-service in
Loki / Grafana.

Why not pull in `structlog`?
  Because every kilobyte of dep matters for offline-friendly distribution
  (a core PRD promise). The stdlib `logging` module emits JSON just fine
  once you write a one-liner formatter, and we only need three fields.
  If a service already imports structlog it can still call `setup_logging`
  — we don't fight it.

Public surface:

    setup_logging(service_name) -> None
        Idempotent. Replaces the root logger's handler with a JSON one.

    RequestIdMiddleware
        ASGI middleware. Reads `X-Request-Id` from the inbound request
        (or generates a UUID4 if missing), stores it on the request state,
        echoes it on the response, and binds it to a ContextVar so any
        downstream log call picks it up.

    install(app, service_name) -> None
        Convenience wrapper: setup_logging + add_middleware in one call.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Awaitable, Callable, Optional

# ContextVar so any log call inside a request handler picks up the id
# without the handler having to pass it around explicitly.
_request_id_var: ContextVar[Optional[str]] = ContextVar("sovereign_request_id", default=None)

_REQUEST_ID_HEADER = "X-Request-Id"


def current_request_id() -> Optional[str]:
    """Returns the request id bound to this async task, or None."""
    return _request_id_var.get()


class _JsonFormatter(logging.Formatter):
    """A no-dependencies JSON line formatter."""

    def __init__(self, service_name: str) -> None:
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "service": self.service_name,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        rid = _request_id_var.get()
        if rid:
            payload["request_id"] = rid
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        # Anything passed via `logger.info("...", extra={"foo": 1})`
        for key, value in record.__dict__.items():
            if key in payload or key.startswith("_"):
                continue
            if key in {
                "args", "asctime", "created", "exc_info", "exc_text", "filename",
                "funcName", "levelname", "levelno", "lineno", "message",
                "module", "msecs", "msg", "name", "pathname", "process",
                "processName", "relativeCreated", "stack_info", "thread", "threadName",
                "taskName",
            }:
                continue
            try:
                json.dumps(value)
                payload[key] = value
            except (TypeError, ValueError):
                payload[key] = repr(value)
        return json.dumps(payload, separators=(",", ":"))


def setup_logging(service_name: str, level: Optional[str] = None) -> None:
    """Install a JSON formatter on the root logger.

    Safe to call multiple times — duplicates are removed so test suites
    that re-import services don't end up with N copies of every line.
    """
    root = logging.getLogger()
    level_name = (level or os.getenv("LOG_LEVEL") or "INFO").upper()
    root.setLevel(level_name)

    # Strip any previously-installed Sovereign handler so this is idempotent.
    for handler in list(root.handlers):
        if getattr(handler, "_sovereign_handler", False):
            root.removeHandler(handler)

    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setLevel(level_name)
    handler.setFormatter(_JsonFormatter(service_name))
    handler._sovereign_handler = True  # type: ignore[attr-defined]
    root.addHandler(handler)


class RequestIdMiddleware:
    """ASGI middleware that ensures every request has an X-Request-Id."""

    def __init__(self, app) -> None:
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Pull the id from headers (case-insensitive). Headers in ASGI are
        # raw bytes tuples; FastAPI normalises them to lower-case names.
        rid: Optional[str] = None
        for name, value in scope.get("headers", []):
            if name.lower() == _REQUEST_ID_HEADER.lower().encode("latin-1"):
                try:
                    rid = value.decode("latin-1").strip()
                except Exception:
                    rid = None
                break

        if not rid:
            rid = uuid.uuid4().hex

        token = _request_id_var.set(rid)

        async def send_with_header(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers") or [])
                headers.append(
                    (_REQUEST_ID_HEADER.encode("latin-1"), rid.encode("latin-1"))
                )
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_with_header)
        finally:
            _request_id_var.reset(token)


def install(app, service_name: str, level: Optional[str] = None) -> None:
    """One-call setup: configure logging + add middleware to a FastAPI app."""
    setup_logging(service_name, level=level)
    app.add_middleware(RequestIdMiddleware)


__all__ = [
    "setup_logging",
    "install",
    "current_request_id",
    "RequestIdMiddleware",
]
