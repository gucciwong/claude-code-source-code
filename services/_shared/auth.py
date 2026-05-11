"""Local-token authentication for Sovereign Code services.

Design
------
Every service that handles sensitive operations (training start/feedback,
model download, mirror switch, enterprise-data access, execution-trace exec)
must depend on `verify_local_token`. The shared secret is generated once by
the desktop app on first boot and stored at `~/.sovereign-code/local.token`,
or provided directly via the `SOVEREIGN_LOCAL_TOKEN` env var.

The Electron renderer reads this token via preload and attaches
`Authorization: Bearer <token>` to every service call. Code that runs
**outside** the desktop app (random `curl`, browser tab, malicious child
process) will not have the token and is rejected with 401.

Dev convenience
---------------
Set `SOVEREIGN_LOCAL_AUTH_DISABLED=1` to bypass enforcement during local
development. A WARNING is logged on first request; never enable in production.

This module deliberately depends only on `fastapi` and the Python stdlib,
so it can be imported by any service without adding new dependencies.
"""

from __future__ import annotations

import hmac
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)

# Environment variable names — kept as module constants so tests can monkeypatch
# them and so the names are documented in one place.
ENV_TOKEN = "SOVEREIGN_LOCAL_TOKEN"
ENV_TOKEN_FILE = "SOVEREIGN_LOCAL_TOKEN_FILE"
ENV_DISABLED = "SOVEREIGN_LOCAL_AUTH_DISABLED"

DEFAULT_TOKEN_PATH = Path.home() / ".sovereign-code" / "local.token"

# `auto_error=False` lets us return a clearer 401 message ourselves instead of
# the default opaque "Not authenticated".
_bearer_scheme = HTTPBearer(auto_error=False)

# Internal flag so the "dev mode" warning is logged once per process, not once
# per request.
_dev_warning_emitted = False


@dataclass(frozen=True)
class TokenSource:
    """Where a configured token came from. Mostly useful for tests/diagnostics."""

    value: str
    origin: str  # "env" | "file"


def _read_token_file(path: Path) -> Optional[str]:
    """Read and strip the token file, or return None if missing/empty."""
    try:
        raw = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None
    except OSError as exc:
        # Permission error, IO error etc. — log and treat as "no token configured"
        # so the caller raises 503-ish behavior consistently via dev-mode fallback.
        logger.warning("auth: failed to read token file %s: %s", path, exc)
        return None
    token = raw.strip()
    return token or None


def _resolve_configured_token() -> Optional[TokenSource]:
    """Resolve the expected token from env or file. Env wins over file."""
    env_token = os.environ.get(ENV_TOKEN, "").strip()
    if env_token:
        return TokenSource(value=env_token, origin="env")

    file_path_str = os.environ.get(ENV_TOKEN_FILE, "").strip()
    file_path = Path(file_path_str) if file_path_str else DEFAULT_TOKEN_PATH
    file_token = _read_token_file(file_path)
    if file_token:
        return TokenSource(value=file_token, origin="file")

    return None


def _auth_disabled() -> bool:
    """Whether the dev bypass flag is set."""
    return os.environ.get(ENV_DISABLED, "").strip() == "1"


def _emit_dev_warning_once() -> None:
    global _dev_warning_emitted
    if not _dev_warning_emitted:
        logger.warning(
            "auth: %s=1 — local token enforcement DISABLED. "
            "This is for local development only. Do NOT use in production.",
            ENV_DISABLED,
        )
        _dev_warning_emitted = True


def reset_dev_warning_for_tests() -> None:
    """Test helper: clear the once-only dev warning flag."""
    global _dev_warning_emitted
    _dev_warning_emitted = False


async def verify_local_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> str:
    """FastAPI dependency: validate `Authorization: Bearer <token>` against the
    locally configured token.

    Returns the validated token string on success. Raises `HTTPException(401)`
    on any failure unless the dev-mode bypass is active, in which case it
    returns an empty string and logs a one-time warning.
    """
    if _auth_disabled():
        _emit_dev_warning_once()
        return ""

    if credentials is None or not credentials.scheme:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unsupported auth scheme; use Bearer",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expected = _resolve_configured_token()
    if expected is None:
        # No token configured anywhere → server is misconfigured for a
        # protected route. Fail closed.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Server has no local token configured",
            headers={"WWW-Authenticate": "Bearer"},
        )

    presented = (credentials.credentials or "").strip()
    # Use constant-time compare to avoid leaking token length / prefix via timing.
    if not hmac.compare_digest(presented, expected.value):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid local token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return presented


__all__ = [
    "verify_local_token",
    "reset_dev_warning_for_tests",
    "ENV_TOKEN",
    "ENV_TOKEN_FILE",
    "ENV_DISABLED",
    "DEFAULT_TOKEN_PATH",
    "TokenSource",
]
