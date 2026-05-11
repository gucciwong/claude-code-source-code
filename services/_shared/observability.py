"""W6-T17 — Shared Prometheus instrumentation for all Sovereign Code services.

This module intentionally keeps the third-party surface area tiny: it uses
`prometheus_client` directly (a stable stdlib-quality library) so services
that already use slowapi + fastapi + uvicorn don't need to pull in a heavy
new dependency tree.

Two metrics are exported per service:

  http_requests_total{service, method, path, status}    counter
  http_request_duration_seconds{service, method, path}  histogram (5 buckets)

Plus a `/metrics` endpoint that serves the Prometheus exposition format.

Usage from each service's `main.py`:

    from _shared.observability import setup_metrics
    setup_metrics(app, service_name="model-manager")

`setup_metrics` is idempotent — calling twice is a no-op (we tag the app
state to track installation).
"""

from __future__ import annotations

import logging
import time
from typing import Callable

logger = logging.getLogger(__name__)

# Imported lazily so a service with a missing dep degrades gracefully.
_HAS_PROM: bool | None = None


def _try_import_prometheus():
    global _HAS_PROM
    if _HAS_PROM is False:
        return None
    try:
        from prometheus_client import (  # noqa: WPS433 — runtime import is the point
            CONTENT_TYPE_LATEST,
            CollectorRegistry,
            Counter,
            Histogram,
            generate_latest,
        )

        _HAS_PROM = True
        return {
            "CONTENT_TYPE_LATEST": CONTENT_TYPE_LATEST,
            "CollectorRegistry": CollectorRegistry,
            "Counter": Counter,
            "Histogram": Histogram,
            "generate_latest": generate_latest,
        }
    except Exception as exc:  # pragma: no cover — defensive
        _HAS_PROM = False
        logger.warning("observability: prometheus_client not available (%s) — /metrics will return 503", exc)
        return None


# Standard latency buckets, in seconds. Tuned for code-completion / chat
# workloads: tight resolution at <1s where most local-model interactions live.
DEFAULT_BUCKETS = (0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0)


def setup_metrics(
    app,
    service_name: str,
    *,
    buckets: tuple = DEFAULT_BUCKETS,
    metrics_path: str = "/metrics",
) -> bool:
    """Wire prometheus middleware + /metrics endpoint into a FastAPI app.

    Returns True on successful install, False if `prometheus_client` is
    missing (the service will still start; `/metrics` just returns 503).
    """
    if getattr(app.state, "_sovereign_observability_installed", False):
        return True

    prom = _try_import_prometheus()
    if prom is None:
        # Install a stub /metrics so dashboards can probe without 404 noise.
        _install_stub_metrics(app, metrics_path)
        app.state._sovereign_observability_installed = True
        return False

    registry = prom["CollectorRegistry"]()
    requests = prom["Counter"](
        "http_requests_total",
        "Total HTTP requests handled.",
        labelnames=("service", "method", "path", "status"),
        registry=registry,
    )
    latency = prom["Histogram"](
        "http_request_duration_seconds",
        "HTTP request latency in seconds.",
        labelnames=("service", "method", "path"),
        buckets=buckets,
        registry=registry,
    )

    @app.middleware("http")
    async def _prom_middleware(request, call_next: Callable):
        # Skip the /metrics endpoint itself to avoid feedback loops.
        if request.url.path == metrics_path:
            return await call_next(request)

        start = time.perf_counter()
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            elapsed = time.perf_counter() - start
            # Use the *route template* (e.g. /api/v1/models/{id}/download) rather than
            # the concrete URL so high-cardinality path params don't explode the
            # metric label space. FastAPI puts this on request.scope["route"].path.
            route = request.scope.get("route")
            path = getattr(route, "path", None) or request.url.path
            requests.labels(service_name, request.method, path, str(status_code)).inc()
            latency.labels(service_name, request.method, path).observe(elapsed)

    @app.get(metrics_path)
    async def _metrics_endpoint():
        from fastapi.responses import Response

        return Response(
            content=prom["generate_latest"](registry),
            media_type=prom["CONTENT_TYPE_LATEST"],
        )

    app.state._sovereign_observability_installed = True
    app.state._sovereign_metrics_registry = registry
    logger.info("observability: prometheus metrics installed for %s at %s", service_name, metrics_path)
    return True


def _install_stub_metrics(app, metrics_path: str) -> None:
    @app.get(metrics_path)
    async def _stub():
        from fastapi.responses import PlainTextResponse

        return PlainTextResponse(
            "# prometheus_client not installed in this service\n",
            status_code=503,
        )


__all__ = ["setup_metrics", "DEFAULT_BUCKETS"]
