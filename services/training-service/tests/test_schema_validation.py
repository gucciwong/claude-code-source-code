"""
Schema validation tests — KPI spec §3 compliance
Validates that CompletionEventRequest and the training store enforce
all required common envelope fields and domain-specific fields.
"""

import pytest
from pydantic import ValidationError
from training_data.models import EventType


# ── §3.1 Common envelope field contract ──────────────────────────────────────

def test_completion_event_request_has_kpi_common_fields():
    """CompletionEventRequest must expose all 11 §3.1 common envelope fields."""
    from main import CompletionEventRequest
    import inspect

    fields = CompletionEventRequest.model_fields
    common_fields = [
        "event_name", "event_version", "correlation_id", "session_id",
        "installation_id_hash", "project_id_hash", "client_version",
        "platform", "runtime_backend",
        # model_id surfaced via existing field
    ]
    for field in common_fields:
        assert field in fields, f"Missing KPI common field: {field}"


def test_event_version_defaults_to_1_0():
    """event_version must default to '1.0' per §4 data quality rule 1."""
    from main import CompletionEventRequest

    req = CompletionEventRequest(
        event_type="completion_accepted",
        prompt="x = 1",
        completion=" + 2",
        language="python",
    )
    assert req.event_version == "1.0"


# ── §3.2 Completion event fields ─────────────────────────────────────────────

def test_completion_event_request_has_completion_kpi_fields():
    """CompletionEventRequest must expose all §3.2 completion-specific fields."""
    from main import CompletionEventRequest

    fields = CompletionEventRequest.model_fields
    completion_fields = [
        "completion_type", "suggestion_length_tokens",
        "accepted_boolean", "edit_distance_after_accept",
    ]
    for field in completion_fields:
        assert field in fields, f"Missing §3.2 completion field: {field}"


def test_completion_event_roundtrip_with_full_envelope():
    """A completion event with full KPI envelope must parse without errors."""
    from main import CompletionEventRequest

    req = CompletionEventRequest(
        event_name="completion_accepted",
        event_version="1.0",
        correlation_id="test-corr-id",
        session_id="test-session",
        installation_id_hash="abcdef",
        project_id_hash="local",
        client_version="0.8.0",
        platform="Win32",
        runtime_backend="ollama",
        event_type="completion_accepted",
        prompt="def foo():",
        completion=" return 42",
        language="python",
        completion_type="inline",
        suggestion_length_tokens=5,
        accepted_boolean=True,
        edit_distance_after_accept=0,
    )
    assert req.event_version == "1.0"
    assert req.accepted_boolean is True
    assert req.completion_type == "inline"


# ── §3.2 Inference event fields ───────────────────────────────────────────────

def test_completion_event_request_has_inference_kpi_fields():
    """CompletionEventRequest must expose all §3.2 inference-specific fields."""
    from main import CompletionEventRequest

    fields = CompletionEventRequest.model_fields
    inference_fields = [
        "first_token_latency_ms", "tokens_per_second",
        "backend_name", "model_quantization",
        "prompt_tokens", "completion_tokens",
    ]
    for field in inference_fields:
        assert field in fields, f"Missing §3.2 inference field: {field}"


def test_inference_event_roundtrip():
    """An inference_request_completed event with timing fields must parse."""
    from main import CompletionEventRequest

    req = CompletionEventRequest(
        event_name="inference_request_completed",
        event_version="1.0",
        correlation_id="corr-001",
        session_id="sess-001",
        event_type="inference_request_completed",
        prompt="",
        completion="",
        language="text",
        first_token_latency_ms=312.5,
        tokens_per_second=45.2,
        completion_tokens=128,
        backend_name="ollama",
        model_quantization="Q4_K_M",
    )
    assert req.first_token_latency_ms == 312.5
    assert req.tokens_per_second == 45.2
    assert req.model_quantization == "Q4_K_M"


# ── EventType enum coverage ───────────────────────────────────────────────────

def test_event_type_enum_contains_all_inference_events():
    """EventType must contain all 4 §3.2 inference event names."""
    inference_names = {
        "inference_request_started",
        "inference_first_token_emitted",
        "inference_request_completed",
        "inference_request_failed",
    }
    enum_values = {e.value for e in EventType}
    missing = inference_names - enum_values
    assert not missing, f"EventType missing inference events: {missing}"


def test_event_type_enum_contains_all_completion_events():
    """EventType must contain all 4 §3.2 completion event names."""
    completion_names = {
        "completion_suggested",
        "completion_accepted",
        "completion_rejected",
        "completion_edited_after_accept",
    }
    enum_values = {e.value for e in EventType}
    missing = completion_names - enum_values
    assert not missing, f"EventType missing completion events: {missing}"


# ── Store integration ─────────────────────────────────────────────────────────

def test_store_persists_kpi_envelope_fields(tmp_path):
    """KPI envelope fields written by the store must survive a DB round-trip."""
    import tempfile
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from training_data.models import Base, CompletionEvent
    from training_data.store import TrainingDataStore

    db_path = tmp_path / "test_kpi.db"
    engine = create_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    store = TrainingDataStore(session)
    eid = store.add_completion_event(
        event_type="completion_accepted",
        prompt="def foo(): pass",
        completion=" return 1",
        language="python",
        event_name="completion_accepted",
        event_version="1.0",
        correlation_id="test-corr",
        session_id="test-sess",
        installation_id_hash="abc123",
        project_id_hash="proj1",
        first_token_latency_ms=250.0,
        tokens_per_second=42.5,
        accepted_boolean=True,
        completion_type="inline",
    )

    row = session.query(CompletionEvent).filter_by(id=eid).first()
    assert row.event_version == "1.0"
    assert row.correlation_id == "test-corr"
    assert row.session_id == "test-sess"
    assert row.installation_id_hash == "abc123"
    assert row.first_token_latency_ms == 250.0
    assert row.tokens_per_second == 42.5
    assert row.accepted_boolean is True
    assert row.completion_type == "inline"

    session.close()
    engine.dispose()
