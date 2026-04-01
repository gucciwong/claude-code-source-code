"""Metrics module - Prometheus instrumentation and monitoring."""

from .prometheus import (
    registry,
    MetricsTracker,
    requests_total,
    asr_transcriptions_total,
    tts_syntheses_total,
    active_sessions,
    errors_total,
)
from .middleware import attach_metrics_middleware, MetricsMiddleware

__all__ = [
    "registry",
    "MetricsTracker",
    "attach_metrics_middleware",
    "MetricsMiddleware",
    "requests_total",
    "asr_transcriptions_total",
    "tts_syntheses_total",
    "active_sessions",
    "errors_total",
]
