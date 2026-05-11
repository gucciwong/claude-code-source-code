"""Tests for `_shared/observability.py` (W6-T17).

These exercise the public surface end-to-end via fastapi.TestClient so we
verify both that metrics are *exported* and that high-cardinality URL
parameters don't blow up the label space.
"""
from __future__ import annotations

import re

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from services._shared.observability import setup_metrics


@pytest.fixture
def app() -> FastAPI:
    a = FastAPI()

    @a.get("/hello")
    async def hello():
        return {"ok": True}

    @a.get("/items/{item_id}")
    async def item(item_id: str):
        return {"id": item_id}

    @a.get("/boom")
    async def boom():
        raise RuntimeError("boom")

    return a


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    setup_metrics(app, service_name="test-svc")
    return TestClient(app, raise_server_exceptions=False)


def test_metrics_endpoint_exists(client: TestClient) -> None:
    resp = client.get("/metrics")
    assert resp.status_code == 200
    assert "http_requests_total" in resp.text


def test_request_count_increments(client: TestClient) -> None:
    for _ in range(3):
        client.get("/hello")
    resp = client.get("/metrics")
    body = resp.text
    # Look for the counter with status=200
    matches = re.findall(
        r'http_requests_total\{[^}]*path="/hello"[^}]*status="200"[^}]*\}\s+(\d+(?:\.\d+)?)',
        body,
    )
    assert matches, "counter line missing from /metrics output"
    assert float(matches[-1]) >= 3


def test_route_template_used_not_concrete_path(client: TestClient) -> None:
    """Hitting /items/abc and /items/def should map to a single label set."""
    client.get("/items/abc")
    client.get("/items/def")
    client.get("/items/xyz")
    resp = client.get("/metrics")
    body = resp.text

    template_matches = re.findall(
        r'http_requests_total\{[^}]*path="/items/\{item_id\}"[^}]*status="200"[^}]*\}\s+(\d+(?:\.\d+)?)',
        body,
    )
    assert template_matches, "expected the route template label, got: " + body[:500]
    assert float(template_matches[-1]) >= 3


def test_failed_request_recorded_as_500(client: TestClient) -> None:
    client.get("/boom")
    resp = client.get("/metrics")
    body = resp.text
    assert re.search(r'http_requests_total\{[^}]*path="/boom"[^}]*status="500"', body), \
        "5xx should still show up in counters"


def test_latency_histogram_present(client: TestClient) -> None:
    client.get("/hello")
    resp = client.get("/metrics")
    body = resp.text
    assert "http_request_duration_seconds_bucket" in body
    assert 'le="0.05"' in body
    assert 'le="+Inf"' in body


def test_setup_metrics_is_idempotent(app: FastAPI) -> None:
    setup_metrics(app, service_name="svc-a")
    # A second call must not raise (no double-route registration etc).
    setup_metrics(app, service_name="svc-a")
    client = TestClient(app)
    resp = client.get("/metrics")
    assert resp.status_code == 200


def test_metrics_path_not_recursively_recorded(client: TestClient) -> None:
    """Hitting /metrics shouldn't increment its own counter (would cause
    a feedback loop)."""
    client.get("/metrics")
    client.get("/metrics")
    resp = client.get("/metrics")
    # /metrics counter should NOT appear in the output
    assert re.search(r'path="/metrics"', resp.text) is None
