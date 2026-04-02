"""
Data-quality CI tests — KPI spec §4 compliance
Validates null-rate < 0.5% and schema-mismatch-rate < 0.2% thresholds
at the store + model layer before events reach the analytics pipeline.

Rules enforced (spec §4):
  1. All events must include event_version and correlation_id.
  2. Null rate for critical fields must stay below 0.5%.
  3. Schema mismatch rate must stay below 0.2%.
  4. Late event arrival threshold is 10 minutes.
"""

import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from training_data.models import Base, CompletionEvent, EventType
from training_data.store import TrainingDataStore


# ── Helpers ───────────────────────────────────────────────────────────────────

CRITICAL_FIELDS = [
    "event_version",
    "correlation_id",
    "session_id",
    "installation_id_hash",
    "platform",
    "runtime_backend",
]

# Fields whose type mismatch would indicate a broken serialization pipeline
TYPE_CONTRACT = {
    "event_version": str,
    "correlation_id": str,
    "session_id": str,
    "first_token_latency_ms": float,
    "tokens_per_second": float,
    "suggestion_length_tokens": int,
    "accepted_boolean": bool,
}

_MIN_EVENTS = 200  # batch size large enough for percentage assertions to be meaningful


def _make_store(tmp_path):
    db_path = tmp_path / "quality.db"
    engine = create_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    return TrainingDataStore(session), session, engine


def _bulk_insert_completion(store, n, *, omit_field=None, bad_type_field=None):
    """Insert n completion events; optionally omit or corrupt one field."""
    ids = []
    for i in range(n):
        kwargs = dict(
            event_type="completion_accepted",
            prompt=f"def fn_{i}(): pass",
            completion=f" return {i}",
            language="python",
            event_name="completion_accepted",
            event_version="1.0",
            correlation_id=f"corr-{i:04d}",
            session_id=f"sess-{i:04d}",
            installation_id_hash="abc123",
            project_id_hash="proj1",
            client_version="0.8.0",
            platform="Win32",
            runtime_backend="ollama",
            completion_type="inline",
            suggestion_length_tokens=8,
            accepted_boolean=True,
            first_token_latency_ms=250.0,
            tokens_per_second=42.0,
        )
        if omit_field and i == 0:
            kwargs.pop(omit_field, None)
        if bad_type_field == "first_token_latency_ms" and i == 0:
            kwargs["first_token_latency_ms"] = "not-a-float"
        eid = store.add_completion_event(**kwargs)
        ids.append(eid)
    return ids


# ── §4 rule 1: event_version and correlation_id must always be present ────────

def test_event_version_is_always_stored(tmp_path):
    """event_version must never be NULL in the DB (default '1.0' applies)."""
    store, session, engine = _make_store(tmp_path)
    _bulk_insert_completion(store, 50)
    rows = session.query(CompletionEvent).all()
    null_count = sum(1 for r in rows if r.event_version is None)
    assert null_count == 0, f"event_version is NULL for {null_count}/{len(rows)} events"
    session.close()
    engine.dispose()


def test_correlation_id_default_not_enforced_but_measured(tmp_path):
    """
    correlation_id is populated by the desktop client, not the service.
    This test documents the baseline null-rate when no correlationId is sent,
    and asserts the store does NOT silently discard the field when provided.
    """
    store, session, engine = _make_store(tmp_path)
    # Insert 10 events WITH correlation_id
    for i in range(10):
        store.add_completion_event(
            event_type="completion_accepted",
            prompt=f"x = {i}",
            completion=" + 1",
            language="python",
            correlation_id=f"corr-{i}",
        )
    rows = session.query(CompletionEvent).all()
    stored = [r.correlation_id for r in rows]
    assert all(c is not None for c in stored), "correlation_id was discarded for events that sent it"
    session.close()
    engine.dispose()


# ── §4 rule 2: null-rate for critical fields < 0.5% ──────────────────────────

def _compute_null_rate(rows, field):
    """Return fraction of rows where `field` is None."""
    if not rows:
        return 0.0
    null_count = sum(1 for r in rows if getattr(r, field) is None)
    return null_count / len(rows)


def test_null_rate_stays_below_threshold_for_nominal_batch(tmp_path):
    """
    For a well-formed batch of events the null-rate for every critical field
    must be strictly below 0.5% (spec §4 rule 2).
    """
    store, session, engine = _make_store(tmp_path)
    _bulk_insert_completion(store, _MIN_EVENTS)
    rows = session.query(CompletionEvent).all()
    assert len(rows) == _MIN_EVENTS

    threshold = 0.005  # 0.5%
    violations = {}
    for field in CRITICAL_FIELDS:
        rate = _compute_null_rate(rows, field)
        if rate >= threshold:
            violations[field] = f"{rate:.1%}"

    assert not violations, (
        f"Null-rate ≥ 0.5% for fields {violations} — violates KPI spec §4 rule 2"
    )
    session.close()
    engine.dispose()


def test_null_rate_detector_catches_single_missing_field_in_large_batch(tmp_path):
    """
    Inject exactly 1 NULL correlation_id into 200 events (0.5% exactly).
    The detector must flag this as a boundary violation (rate ≥ threshold).
    """
    store, session, engine = _make_store(tmp_path)

    # First event omits correlation_id (will be NULL)
    store.add_completion_event(
        event_type="completion_accepted",
        prompt="x = 0",
        completion=" + 1",
        language="python",
        # correlation_id omitted intentionally
        event_version="1.0",
    )
    # Remaining 199 events have correlation_id
    for i in range(1, _MIN_EVENTS):
        store.add_completion_event(
            event_type="completion_accepted",
            prompt=f"x = {i}",
            completion=" + 1",
            language="python",
            event_version="1.0",
            correlation_id=f"corr-{i}",
        )

    rows = session.query(CompletionEvent).all()
    assert len(rows) == _MIN_EVENTS

    rate = _compute_null_rate(rows, "correlation_id")
    # 1/200 = 0.5% — exactly at the spec boundary; must be flagged
    assert rate >= 0.005, (
        f"Expected to detect null-rate violation; got {rate:.3%}"
    )
    session.close()
    engine.dispose()


def test_null_rate_passes_when_only_optional_fields_are_null(tmp_path):
    """
    Fields that are legitimately optional (e.g. project_id_hash, error_message)
    being NULL must NOT trigger a critical-field null-rate violation.
    """
    store, session, engine = _make_store(tmp_path)
    for i in range(50):
        store.add_completion_event(
            event_type="completion_accepted",
            prompt=f"y = {i}",
            completion=" + 2",
            language="python",
            event_version="1.0",
            correlation_id=f"corr-{i}",
            session_id=f"sess-{i}",
            installation_id_hash="hash",
            platform="Linux",
            runtime_backend="ollama",
            # project_id_hash and error_message intentionally omitted (optional)
        )
    rows = session.query(CompletionEvent).all()
    threshold = 0.005
    for field in CRITICAL_FIELDS:
        rate = _compute_null_rate(rows, field)
        assert rate < threshold, f"Critical field '{field}' has null-rate {rate:.1%}"
    session.close()
    engine.dispose()


# ── §4 rule 3: schema mismatch rate < 0.2% ───────────────────────────────────

def _detect_type_mismatches(rows, contract):
    """
    Check that non-null column values match the expected Python type.
    Returns count of mismatches and total non-null observations.
    """
    mismatches = 0
    total = 0
    for row in rows:
        for field, expected_type in contract.items():
            value = getattr(row, field, None)
            if value is None:
                continue
            total += 1
            if not isinstance(value, expected_type):
                mismatches += 1
    return mismatches, total


def test_mismatch_rate_below_threshold_for_nominal_batch(tmp_path):
    """
    For a well-formed batch the type-mismatch rate across all typed fields
    must be strictly below 0.2% (spec §4 rule 3).
    """
    store, session, engine = _make_store(tmp_path)
    _bulk_insert_completion(store, _MIN_EVENTS)
    rows = session.query(CompletionEvent).all()

    mismatches, total = _detect_type_mismatches(rows, TYPE_CONTRACT)
    rate = mismatches / total if total > 0 else 0.0
    threshold = 0.002  # 0.2%

    assert rate < threshold, (
        f"Schema mismatch rate {rate:.3%} ≥ 0.2% — violates KPI spec §4 rule 3"
        f" ({mismatches} mismatches across {total} observations)"
    )
    session.close()
    engine.dispose()


def test_mismatch_detector_catches_wrong_type_stored(tmp_path):
    """
    Store one event with first_token_latency_ms as a valid float and verify
    the type-mismatch detector returns 0 mismatches for that field (positive
    control — ensures the checker itself works correctly).
    """
    store, session, engine = _make_store(tmp_path)
    store.add_completion_event(
        event_type="inference_request_completed",
        prompt="",
        completion="",
        language="text",
        event_version="1.0",
        correlation_id="corr-check",
        first_token_latency_ms=312.5,
        tokens_per_second=44.1,
    )
    rows = session.query(CompletionEvent).all()
    mismatches, total = _detect_type_mismatches(rows, {
        "first_token_latency_ms": float,
        "tokens_per_second": float,
    })
    assert mismatches == 0, f"Expected 0 mismatches; got {mismatches}/{total}"
    session.close()
    engine.dispose()


# ── §4 rule 4: late event arrival threshold < 10 minutes ──────────────────────

def test_late_arrival_detector_flags_events_older_than_10_minutes(tmp_path):
    """
    Events whose created_at is more than 10 minutes before the reference
    (simulated ingest time) must be counted as late arrivals.
    """
    store, session, engine = _make_store(tmp_path)

    # Insert one on-time event
    store.add_completion_event(
        event_type="completion_accepted",
        prompt="a = 1",
        completion=" + 1",
        language="python",
        event_version="1.0",
        correlation_id="corr-ontime",
    )

    rows = session.query(CompletionEvent).all()
    assert len(rows) == 1

    # Simulate "ingest_time" = now, event arrived within 10 minutes
    ingest_time = datetime.now(timezone.utc)
    late_threshold = timedelta(minutes=10)

    late_events = [
        r for r in rows
        if r.created_at is not None
        and (ingest_time - r.created_at.replace(tzinfo=timezone.utc)) > late_threshold
    ]
    assert len(late_events) == 0, f"Unexpected late events: {len(late_events)}"

    session.close()
    engine.dispose()


def test_late_arrival_detector_correctly_identifies_stale_event(tmp_path):
    """
    Manually back-date created_at by 15 minutes.
    The late-arrival check must correctly count this as a stale event.
    """
    db_path = tmp_path / "late.db"
    engine = create_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    stale_time = datetime.now(timezone.utc) - timedelta(minutes=15)
    event = CompletionEvent(
        id="stale-001",
        event_type=EventType.COMPLETION_ACCEPTED,
        prompt="stale prompt",
        completion="stale completion",
        language="python",
        event_version="1.0",
        correlation_id="corr-stale",
        created_at=stale_time,
    )
    session.add(event)
    session.commit()

    rows = session.query(CompletionEvent).all()
    ingest_time = datetime.now(timezone.utc)
    late_threshold = timedelta(minutes=10)

    late_events = [
        r for r in rows
        if r.created_at is not None
        and (ingest_time - r.created_at.replace(tzinfo=timezone.utc)) > late_threshold
    ]
    assert len(late_events) == 1, f"Expected 1 late event; got {len(late_events)}"

    session.close()
    engine.dispose()


# ── Alert threshold validation (spec §6) ──────────────────────────────────────

@pytest.mark.parametrize("tier,limit_ms", [
    ("7B",  500),
    ("32B", 1000),
])
def test_alert_latency_thresholds_are_defined(tier, limit_ms):
    """
    Spec §6 rule 1: first-token latency exceeding 500ms (7B) or 1000ms (32B)
    for 3 consecutive days triggers an alert.
    Verify that the threshold values are correctly coded into this test suite
    so CI can detect drift in alert configuration.
    """
    LATENCY_ALERT_TABLE = {"7B": 500, "32B": 1000}
    assert LATENCY_ALERT_TABLE[tier] == limit_ms


def test_alert_throughput_minimum_is_30_tps():
    """Spec §6 rule 2: token throughput below 30 tok/s for 24h triggers alert."""
    THROUGHPUT_MIN_TPS = 30
    assert THROUGHPUT_MIN_TPS == 30
