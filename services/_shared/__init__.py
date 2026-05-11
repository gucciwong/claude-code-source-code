"""Shared utilities for Sovereign Code services.

This package is intentionally light-weight: it exposes only functionality that
must be consistent across every service (auth, structured logging, etc.).
Services import from here via the `services._shared` namespace, OR — when run
as standalone packages — by adding the repository root to `sys.path`.

Modules:
- `auth`: local-token authentication dependency (`verify_local_token`).
"""

from . import auth as auth  # re-export for convenience

__all__ = ["auth"]
