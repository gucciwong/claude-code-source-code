"""Tests for the W5-T14 PerformanceLedger SQLite persistence layer.

Run:
    cd services/model-manager && pytest tests/test_performance_ledger.py -q
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Ensure imports resolve when pytest is run from various CWDs.
_HERE = Path(__file__).resolve().parent
_SERVICE_ROOT = _HERE.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

from engine.model_router import ModelRouter, TaskType  # noqa: E402
from engine.performance_ledger import PerformanceLedger  # noqa: E402


@pytest.fixture
def ledger(tmp_path: Path) -> PerformanceLedger:
    return PerformanceLedger(tmp_path / "router.db")


@pytest.fixture
def router() -> ModelRouter:
    return ModelRouter()


# ---------------------------------------------------------------------------
# Schema + initial state
# ---------------------------------------------------------------------------


def test_creates_db_file_with_schema(tmp_path: Path) -> None:
    db = tmp_path / "nested" / "router.db"
    PerformanceLedger(db)
    assert db.exists(), "ledger should create the db file"


def test_initial_stats_are_zero(ledger: PerformanceLedger) -> None:
    s = ledger.stats()
    assert s.rows == 0
    assert s.total_requests == 0
    assert s.total_acceptances == 0


def test_load_into_empty_db_is_noop(ledger: PerformanceLedger, router: ModelRouter) -> None:
    n = ledger.load_into(router)
    assert n == 0
    assert router.performance_history == {}


# ---------------------------------------------------------------------------
# Record + persistence
# ---------------------------------------------------------------------------


def test_record_persists_to_disk(ledger: PerformanceLedger, router: ModelRouter) -> None:
    ledger.record(router, "qwen2.5-coder-7b", TaskType.COMPLETION, accepted=True, latency_ms=120.0)

    s = ledger.stats()
    assert s.rows == 1
    assert s.total_requests == 1
    assert s.total_acceptances == 1


def test_record_also_mutates_router_in_memory(
    ledger: PerformanceLedger, router: ModelRouter
) -> None:
    ledger.record(router, "qwen2.5-coder-7b", TaskType.COMPLETION, accepted=True, latency_ms=150.0)

    perf = router.performance_history["qwen2.5-coder-7b"][TaskType.COMPLETION]
    assert perf.acceptance_count == 1
    assert perf.rejection_count == 0
    assert perf.total_requests == 1


def test_repeated_records_upsert_same_row(
    ledger: PerformanceLedger, router: ModelRouter
) -> None:
    for _ in range(5):
        ledger.record(
            router,
            "qwen2.5-coder-7b",
            TaskType.COMPLETION,
            accepted=True,
            latency_ms=100.0,
        )
    s = ledger.stats()
    assert s.rows == 1  # upsert — still 1 row
    assert s.total_requests == 5
    assert s.total_acceptances == 5


def test_mixed_accept_reject_aggregates_correctly(
    ledger: PerformanceLedger, router: ModelRouter
) -> None:
    ledger.record(router, "m", TaskType.CHAT, accepted=True, latency_ms=100.0)
    ledger.record(router, "m", TaskType.CHAT, accepted=False, latency_ms=200.0)
    ledger.record(router, "m", TaskType.CHAT, accepted=True, latency_ms=300.0)

    s = ledger.stats()
    assert s.rows == 1
    assert s.total_requests == 3
    assert s.total_acceptances == 2

    perf = router.performance_history["m"][TaskType.CHAT]
    assert perf.acceptance_rate == pytest.approx(2 / 3)
    assert perf.avg_latency_ms == pytest.approx(200.0)


def test_different_models_get_separate_rows(
    ledger: PerformanceLedger, router: ModelRouter
) -> None:
    ledger.record(router, "model-a", TaskType.COMPLETION, accepted=True, latency_ms=100.0)
    ledger.record(router, "model-b", TaskType.COMPLETION, accepted=False, latency_ms=100.0)
    s = ledger.stats()
    assert s.rows == 2


def test_different_task_types_get_separate_rows(
    ledger: PerformanceLedger, router: ModelRouter
) -> None:
    ledger.record(router, "model-a", TaskType.COMPLETION, accepted=True, latency_ms=100.0)
    ledger.record(router, "model-a", TaskType.DEBUGGING, accepted=True, latency_ms=100.0)
    s = ledger.stats()
    assert s.rows == 2


# ---------------------------------------------------------------------------
# Load round-trip
# ---------------------------------------------------------------------------


def test_load_round_trip_restores_router_state(tmp_path: Path) -> None:
    db = tmp_path / "router.db"
    # Session 1: record some data
    ledger1 = PerformanceLedger(db)
    router1 = ModelRouter()
    ledger1.record(router1, "qwen2.5-coder-32b", TaskType.DEBUGGING, accepted=True, latency_ms=400)
    ledger1.record(router1, "qwen2.5-coder-32b", TaskType.DEBUGGING, accepted=True, latency_ms=500)
    ledger1.record(router1, "qwen2.5-coder-32b", TaskType.DEBUGGING, accepted=False, latency_ms=600)

    # Session 2: fresh process, only the ledger remembers anything.
    ledger2 = PerformanceLedger(db)
    router2 = ModelRouter()
    assert router2.performance_history == {}
    n = ledger2.load_into(router2)

    assert n == 1
    perf = router2.performance_history["qwen2.5-coder-32b"][TaskType.DEBUGGING]
    assert perf.acceptance_count == 2
    assert perf.rejection_count == 1
    assert perf.total_requests == 3
    assert perf.total_latency_ms == pytest.approx(1500.0)


def test_load_unknown_task_type_is_skipped(tmp_path: Path) -> None:
    """Defensive: schema may evolve and old rows must not crash startup."""
    import sqlite3

    db = tmp_path / "router.db"
    PerformanceLedger(db)  # creates schema
    with sqlite3.connect(db) as conn:
        conn.execute(
            "INSERT INTO router_performance VALUES (?, ?, ?, ?, ?, ?, ?)",
            ("model-x", "ZZZ_NOT_A_TASK_TYPE", 1, 0, 100.0, 1, 0.0),
        )

    ledger = PerformanceLedger(db)
    router = ModelRouter()
    n = ledger.load_into(router)
    assert n == 0  # Skipped — no crash


# ---------------------------------------------------------------------------
# Learned feedback shifts router decisions
# ---------------------------------------------------------------------------


def test_ledger_feedback_shifts_router_selection_after_restart(tmp_path: Path) -> None:
    """End-to-end: persist preference, restart, verify selection reflects it."""
    db = tmp_path / "router.db"

    # Session 1: train the ledger to prefer 7b for debugging
    ledger1 = PerformanceLedger(db)
    router1 = ModelRouter()
    for _ in range(10):
        ledger1.record(
            router1,
            "qwen2.5-coder-7b",
            TaskType.DEBUGGING,
            accepted=True,
            latency_ms=400.0,
        )
    # And to dislike 32b for debugging
    for _ in range(10):
        ledger1.record(
            router1,
            "qwen2.5-coder-32b",
            TaskType.DEBUGGING,
            accepted=False,
            latency_ms=1200.0,
        )

    # Session 2: fresh router rehydrated from disk
    ledger2 = PerformanceLedger(db)
    router2 = ModelRouter()
    ledger2.load_into(router2)

    # Even though 32b is structurally preferred for debugging, the learned
    # signal should make 7b win. The acceptance rate weight (×20) and the
    # confidence weight (min(N/10, 1)) together add ≈+20 to 7b vs −0 to 32b.
    choice = router2.select_model(
        prompt="fix the login bug",
        available_models=["qwen2.5-coder-7b", "qwen2.5-coder-32b"],
        available_vram_gb=32.0,
    )
    assert choice == "qwen2.5-coder-7b"


# ---------------------------------------------------------------------------
# Admin helpers
# ---------------------------------------------------------------------------


def test_clear_empties_the_table(ledger: PerformanceLedger, router: ModelRouter) -> None:
    ledger.record(router, "m", TaskType.COMPLETION, accepted=True, latency_ms=100.0)
    assert ledger.stats().rows == 1
    ledger.clear()
    assert ledger.stats().rows == 0
