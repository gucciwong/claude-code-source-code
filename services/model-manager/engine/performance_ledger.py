"""W5-T14 — SQLite-backed performance ledger for the Context-Aware Model
Router (CAMR).

The existing `ModelRouter` keeps acceptance/latency stats in a process-local
dict (`self.performance_history`). That works for a single run but loses all
learned signal on restart — undesirable for a feature whose entire value
comes from "the more you use it, the smarter it gets".

This module is intentionally minimal:

  - One SQLite table `router_performance(model_id, task_type, …)`
  - `load_into(router)` rehydrates the router's in-memory dict at startup
  - `record(...)` persists a single accept/reject event AND updates the
    router's in-memory dict so callers still get O(1) reads

We don't subclass `ModelRouter` because tests / consumers already import it
directly; we wrap it from `main.py`'s service-init code instead.
"""

from __future__ import annotations

import logging
import sqlite3
import threading
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator, Optional

from .model_router import ModelPerformance, ModelRouter, TaskType

logger = logging.getLogger(__name__)


_SCHEMA = """
CREATE TABLE IF NOT EXISTS router_performance (
    model_id           TEXT NOT NULL,
    task_type          TEXT NOT NULL,
    acceptance_count   INTEGER NOT NULL DEFAULT 0,
    rejection_count    INTEGER NOT NULL DEFAULT 0,
    total_latency_ms   REAL NOT NULL DEFAULT 0,
    total_requests     INTEGER NOT NULL DEFAULT 0,
    updated_at         REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (model_id, task_type)
);
"""


@dataclass
class LedgerStats:
    """Read-only diagnostic snapshot of the ledger contents."""

    rows: int
    total_requests: int
    total_acceptances: int


class PerformanceLedger:
    """Persist `ModelRouter.performance_history` to a SQLite file."""

    def __init__(self, db_path: Path | str) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        # SQLite is single-writer; we serialise from multiple coroutines /
        # threads via this lock. The volume here is trivially small.
        self._lock = threading.Lock()
        self._init_schema()

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        # Open per-call to keep us off SQLite's "same thread" rule.
        conn = sqlite3.connect(self.db_path, isolation_level=None)
        try:
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=NORMAL")
            yield conn
        finally:
            conn.close()

    def _init_schema(self) -> None:
        with self._conn() as conn:
            conn.executescript(_SCHEMA)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def load_into(self, router: ModelRouter) -> int:
        """Rehydrate `router.performance_history` from disk.

        Returns the number of rows loaded. Existing in-memory state for any
        (model_id, task_type) key is overwritten by the persisted value.
        """
        rows_loaded = 0
        with self._lock, self._conn() as conn:
            cur = conn.execute(
                """
                SELECT model_id, task_type, acceptance_count, rejection_count,
                       total_latency_ms, total_requests
                FROM router_performance
                """
            )
            for row in cur.fetchall():
                model_id, task_type_str, acc, rej, lat, total = row
                try:
                    task_type = TaskType(task_type_str)
                except ValueError:
                    # Skip unknown task types — schema may have evolved.
                    logger.warning("ledger: skipping unknown task_type %r", task_type_str)
                    continue
                router.performance_history.setdefault(model_id, {})[task_type] = ModelPerformance(
                    model_id=model_id,
                    task_type=task_type,
                    acceptance_count=int(acc),
                    rejection_count=int(rej),
                    total_latency_ms=float(lat),
                    total_requests=int(total),
                )
                rows_loaded += 1
        logger.info("ledger: loaded %d performance rows from %s", rows_loaded, self.db_path)
        return rows_loaded

    def record(
        self,
        router: ModelRouter,
        model_id: str,
        task_type: TaskType,
        accepted: bool,
        latency_ms: float,
    ) -> None:
        """Update both the in-memory router state AND the persistent ledger.

        Atomicity: each call upserts one row in a single statement. If the
        SQLite write fails we still keep the in-memory mutation so the user
        doesn't lose feedback signal in the running session.
        """
        # 1) Mutate in-memory first so callers see the change immediately.
        router.record_result(model_id, task_type, accepted, latency_ms)

        # 2) Persist. We compute the new aggregates ourselves so we don't have
        #    to round-trip a SELECT before each UPDATE.
        perf = router.performance_history[model_id][task_type]
        ts = _now()
        try:
            with self._lock, self._conn() as conn:
                conn.execute(
                    """
                    INSERT INTO router_performance
                        (model_id, task_type,
                         acceptance_count, rejection_count,
                         total_latency_ms, total_requests, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(model_id, task_type) DO UPDATE SET
                        acceptance_count = excluded.acceptance_count,
                        rejection_count  = excluded.rejection_count,
                        total_latency_ms = excluded.total_latency_ms,
                        total_requests   = excluded.total_requests,
                        updated_at       = excluded.updated_at
                    """,
                    (
                        model_id,
                        task_type.value,
                        perf.acceptance_count,
                        perf.rejection_count,
                        perf.total_latency_ms,
                        perf.total_requests,
                        ts,
                    ),
                )
        except sqlite3.Error as exc:
            logger.exception("ledger: failed to persist feedback: %s", exc)

    def stats(self) -> LedgerStats:
        """Quick aggregate diagnostic."""
        with self._lock, self._conn() as conn:
            row = conn.execute(
                """
                SELECT COUNT(*),
                       COALESCE(SUM(total_requests), 0),
                       COALESCE(SUM(acceptance_count), 0)
                FROM router_performance
                """
            ).fetchone()
        rows, total, acc = row
        return LedgerStats(
            rows=int(rows or 0),
            total_requests=int(total or 0),
            total_acceptances=int(acc or 0),
        )

    def clear(self) -> None:
        """Drop all rows. Test/admin helper — not exposed via HTTP."""
        with self._lock, self._conn() as conn:
            conn.execute("DELETE FROM router_performance")


def _now() -> float:
    import time

    return time.time()


__all__ = [
    "PerformanceLedger",
    "LedgerStats",
]
