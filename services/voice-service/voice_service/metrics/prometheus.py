"""Prometheus metrics and instrumentation for VibeVoice service.

Defines all custom metrics for tracking ASR performance, TTS operations,
GPU utilization, and load balancing behavior.
"""

from prometheus_client import (
    Counter,
    Gauge,
    Histogram,
    Summary,
    CollectorRegistry,
)
import time
import os

# Create a custom registry
registry = CollectorRegistry()

# ============================================================
# Request Metrics
# ============================================================

# Counter: Total requests by endpoint and method
requests_total = Counter(
    "vibevoice_requests_total",
    "Total requests processed",
    labelnames=["method", "endpoint", "status"],
    registry=registry,
)

# Histogram: Request latency distribution
request_duration_seconds = Histogram(
    "vibevoice_request_duration_seconds",
    "Request latency in seconds",
    labelnames=["method", "endpoint"],
    buckets=(0.01, 0.05, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0),
    registry=registry,
)

# ============================================================
# ASR (Automatic Speech Recognition) Metrics
# ============================================================

# Gauge: ASR model load status
asr_model_loaded = Gauge(
    "vibevoice_asr_model_loaded",
    "ASR model loaded status (1=loaded, 0=not loaded)",
    registry=registry,
)

# Counter: Total transcription requests
asr_transcriptions_total = Counter(
    "vibevoice_asr_transcriptions_total",
    "Total transcription requests",
    labelnames=["model_size", "language", "status"],
    registry=registry,
)

# Histogram: Transcription latency
asr_transcription_duration_seconds = Histogram(
    "vibevoice_asr_transcription_duration_seconds",
    "Transcription latency in seconds",
    labelnames=["model_size", "language"],
    buckets=(0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0),
    registry=registry,
)

# Summary: Transcription word count
asr_transcription_word_count = Summary(
    "vibevoice_asr_transcription_word_count",
    "Number of words in transcription",
    labelnames=["model_size"],
    registry=registry,
)

# Gauge: Average confidence score
asr_confidence_score = Gauge(
    "vibevoice_asr_confidence_score",
    "Average ASR confidence score (0-1)",
    labelnames=["model_size", "language"],
    registry=registry,
)

# Counter: ASR errors by type
asr_errors_total = Counter(
    "vibevoice_asr_errors_total",
    "Total ASR errors",
    labelnames=["model_size", "error_type"],
    registry=registry,
)

# ============================================================
# TTS (Text-to-Speech) Metrics
# ============================================================

# Gauge: TTS model load status
tts_model_loaded = Gauge(
    "vibevoice_tts_model_loaded",
    "TTS model loaded status (1=loaded, 0=not loaded)",
    registry=registry,
)

# Counter: Total synthesis requests
tts_syntheses_total = Counter(
    "vibevoice_tts_syntheses_total",
    "Total TTS synthesis requests",
    labelnames=["language", "status"],
    registry=registry,
)

# Histogram: Synthesis latency
tts_synthesis_duration_seconds = Histogram(
    "vibevoice_tts_synthesis_duration_seconds",
    "TTS synthesis latency in seconds",
    labelnames=["language"],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0),
    registry=registry,
)

# Gauge: Average output duration
tts_output_duration_seconds = Gauge(
    "vibevoice_tts_output_duration_seconds",
    "Average TTS output duration in seconds",
    labelnames=["language"],
    registry=registry,
)

# ============================================================
# GPU/Device Metrics
# ============================================================

# Gauge: GPU memory usage (MB)
gpu_memory_used_mb = Gauge(
    "vibevoice_gpu_memory_used_mb",
    "GPU memory used in MB",
    labelnames=["device", "type"],
    registry=registry,
)

# Gauge: GPU memory total (MB)
gpu_memory_total_mb = Gauge(
    "vibevoice_gpu_memory_total_mb",
    "Total GPU memory in MB",
    labelnames=["device"],
    registry=registry,
)

# Gauge: GPU utilization percentage
gpu_utilization_percent = Gauge(
    "vibevoice_gpu_utilization_percent",
    "GPU utilization percentage (0-100)",
    labelnames=["device"],
    registry=registry,
)

# Gauge: GPU temperature
gpu_temperature_celsius = Gauge(
    "vibevoice_gpu_temperature_celsius",
    "GPU temperature in Celsius",
    labelnames=["device"],
    registry=registry,
)

# Gauge: CPU utilization percentage
cpu_utilization_percent = Gauge(
    "vibevoice_cpu_utilization_percent",
    "CPU utilization percentage (0-100)",
    registry=registry,
)

# Gauge: System memory usage (MB)
system_memory_used_mb = Gauge(
    "vibevoice_system_memory_used_mb",
    "System memory used in MB",
    registry=registry,
)

# ============================================================
# WebSocket Streaming Metrics
# ============================================================

# Gauge: Active WebSocket connections
websocket_connections_active = Gauge(
    "vibevoice_websocket_connections_active",
    "Number of active WebSocket connections",
    registry=registry,
)

# Counter: Total WebSocket connections
websocket_connections_total = Counter(
    "vibevoice_websocket_connections_total",
    "Total WebSocket connections",
    labelnames=["status"],
    registry=registry,
)

# Histogram: WebSocket message latency
websocket_message_latency_ms = Histogram(
    "vibevoice_websocket_message_latency_ms",
    "WebSocket messaging latency in milliseconds",
    buckets=(10, 50, 100, 500, 1000, 5000),
    registry=registry,
)

# Counter: WebSocket audio chunks received
websocket_audio_chunks_total = Counter(
    "vibevoice_websocket_audio_chunks_total",
    "Total audio chunks received via WebSocket",
    registry=registry,
)

# ============================================================
# Session & Caching Metrics
# ============================================================

# Gauge: Active user sessions
active_sessions = Gauge(
    "vibevoice_active_sessions",
    "Number of active transcription sessions",
    registry=registry,
)

# Gauge: Total sessions processed
sessions_total = Counter(
    "vibevoice_sessions_total",
    "Total sessions processed",
    labelnames=["model_id"],
    registry=registry,
)

# Gauge: Active model instances
active_model_instances = Gauge(
    "vibevoice_active_model_instances",
    "Number of active instances with loaded models",
    labelnames=["model_id"],
    registry=registry,
)

# Gauge: Cache hit rate
cache_hit_rate = Gauge(
    "vibevoice_cache_hit_rate",
    "Model cache hit rate (0-1)",
    labelnames=["model_id"],
    registry=registry,
)

# Counter: Cache hits and misses
cache_operations_total = Counter(
    "vibevoice_cache_operations_total",
    "Total cache operations",
    labelnames=["model_id", "operation"],
    registry=registry,
)

# ============================================================
# Load Balancing Metrics
# ============================================================

# Gauge: Instance availability
instance_available = Gauge(
    "vibevoice_instance_available",
    "Instance availability status (1=available, 0=unavailable)",
    labelnames=["instance_id"],
    registry=registry,
)

# Gauge: Instance health score
instance_health_score = Gauge(
    "vibevoice_instance_health_score",
    "Instance health score (0-100)",
    labelnames=["instance_id"],
    registry=registry,
)

# Gauge: Sessions per instance
sessions_per_instance = Gauge(
    "vibevoice_sessions_per_instance",
    "Number of sessions handled by instance",
    labelnames=["instance_id"],
    registry=registry,
)

# Gauge: Request distribution
requests_per_instance = Counter(
    "vibevoice_requests_per_instance",
    "Requests handled by instance",
    labelnames=["instance_id", "endpoint"],
    registry=registry,
)

# ============================================================
# Queue & Concurrency Metrics
# ============================================================

# Gauge: Request queue depth
request_queue_depth = Gauge(
    "vibevoice_request_queue_depth",
    "Number of requests in queue",
    registry=registry,
)

# Gauge: Max queue depth (for alerting)
request_queue_depth_max = Gauge(
    "vibevoice_request_queue_depth_max",
    "Maximum queue depth observed",
    registry=registry,
)

# Histogram: Queue wait time
queue_wait_duration_seconds = Histogram(
    "vibevoice_queue_wait_duration_seconds",
    "Time spent in queue (seconds)",
    buckets=(0.001, 0.01, 0.1, 0.5, 1.0, 5.0, 10.0),
    registry=registry,
)

# ============================================================
# Error & Exception Metrics
# ============================================================

# Counter: Total errors by type
errors_total = Counter(
    "vibevoice_errors_total",
    "Total errors by type",
    labelnames=["error_type", "endpoint"],
    registry=registry,
)

# Counter: Timeout errors
timeouts_total = Counter(
    "vibevoice_timeouts_total",
    "Total timeout errors",
    labelnames=["endpoint"],
    registry=registry,
)

# ============================================================
# Custom Application Logic
# ============================================================


class MetricsTracker:
    """Helper class to track metrics across the application."""

    @staticmethod
    def record_request(method: str, endpoint: str, status: int, duration: float):
        """Record a request completion."""
        requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
        request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)

    @staticmethod
    def record_transcription(
        model_size: str,
        language: str,
        status: str,
        duration: float,
        word_count: int = 0,
        confidence: float = 0.0,
    ):
        """Record a transcription completion."""
        asr_transcriptions_total.labels(
            model_size=model_size, language=language, status=status
        ).inc()
        asr_transcription_duration_seconds.labels(
            model_size=model_size, language=language
        ).observe(duration)
        if word_count > 0:
            asr_transcription_word_count.labels(model_size=model_size).observe(word_count)
        if confidence > 0:
            asr_confidence_score.labels(model_size=model_size, language=language).set(
                confidence
            )

    @staticmethod
    def record_synthesis(language: str, status: str, duration: float, output_duration: float = 0.0):
        """Record a TTS synthesis completion."""
        tts_syntheses_total.labels(language=language, status=status).inc()
        tts_synthesis_duration_seconds.labels(language=language).observe(duration)
        if output_duration > 0:
            tts_output_duration_seconds.labels(language=language).set(output_duration)

    @staticmethod
    def update_gpu_metrics(
        device: str,
        memory_used: float,
        memory_total: float,
        utilization: float,
        temperature: float = 0.0,
    ):
        """Update GPU metrics."""
        gpu_memory_used_mb.labels(device=device, type="used").set(memory_used)
        gpu_memory_total_mb.labels(device=device).set(memory_total)
        gpu_utilization_percent.labels(device=device).set(utilization)
        if temperature > 0:
            gpu_temperature_celsius.labels(device=device).set(temperature)

    @staticmethod
    def update_instance_health(instance_id: str, available: bool, health_score: float):
        """Update instance health metrics."""
        instance_available.labels(instance_id=instance_id).set(1 if available else 0)
        instance_health_score.labels(instance_id=instance_id).set(health_score)

    @staticmethod
    def record_error(error_type: str, endpoint: str = "unknown"):
        """Record an error occurrence."""
        errors_total.labels(error_type=error_type, endpoint=endpoint).inc()


# Export metrics for monitoring
__all__ = [
    "registry",
    "requests_total",
    "request_duration_seconds",
    "asr_model_loaded",
    "asr_transcriptions_total",
    "asr_transcription_duration_seconds",
    "asr_confidence_score",
    "tts_model_loaded",
    "tts_syntheses_total",
    "gpu_memory_used_mb",
    "gpu_utilization_percent",
    "websocket_connections_active",
    "active_sessions",
    "instance_available",
    "errors_total",
    "MetricsTracker",
]
