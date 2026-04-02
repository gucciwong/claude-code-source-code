"""15 tests for AuditLogger."""
from __future__ import annotations

import hashlib

import pytest

from enterprise_data.audit_logger import AuditLogger


@pytest.fixture()
def logger() -> AuditLogger:
    """Fresh in-memory logger for every test."""
    return AuditLogger(db_path=":memory:")


# ---------------------------------------------------------------------------
# log() — basic behaviour
# ---------------------------------------------------------------------------


def test_log_returns_row_id(logger: AuditLogger) -> None:
    row_id = logger.log("user1", "conn1", "hash1")
    assert isinstance(row_id, int)
    assert row_id >= 1


def test_log_first_entry_prev_hash_empty(logger: AuditLogger) -> None:
    logger.log("user1", "conn1", "hash1")
    entries = logger.get_all()
    assert entries[0]["prev_hash"] == ""


def test_log_second_entry_prev_hash_set(logger: AuditLogger) -> None:
    logger.log("user1", "conn1", "hash1")
    logger.log("user2", "conn2", "hash2")
    entries = logger.get_all()
    assert entries[1]["prev_hash"] == entries[0]["row_hash"]


def test_log_audit_records_pii_count(logger: AuditLogger) -> None:
    logger.log("user1", "conn1", "hash1", rows_returned=5, pii_entities_masked=3)
    entries = logger.get_all()
    assert entries[0]["pii_entities_masked"] == 3
    assert entries[0]["rows_returned"] == 5


# ---------------------------------------------------------------------------
# get_all()
# ---------------------------------------------------------------------------


def test_get_all_empty(logger: AuditLogger) -> None:
    assert logger.get_all() == []


def test_get_all_returns_entries(logger: AuditLogger) -> None:
    for i in range(3):
        logger.log(f"user{i}", "conn1", f"hash{i}")
    entries = logger.get_all()
    assert len(entries) == 3


def test_get_all_order_ascending(logger: AuditLogger) -> None:
    for i in range(3):
        logger.log("user1", "conn1", f"hash{i}")
    entries = logger.get_all()
    ids = [e["id"] for e in entries]
    assert ids == sorted(ids)


# ---------------------------------------------------------------------------
# verify_chain()
# ---------------------------------------------------------------------------


def test_verify_chain_empty(logger: AuditLogger) -> None:
    assert logger.verify_chain() is True


def test_verify_chain_valid(logger: AuditLogger) -> None:
    for i in range(3):
        logger.log("user1", "conn1", f"hash{i}")
    assert logger.verify_chain() is True


def test_verify_chain_tampered(logger: AuditLogger) -> None:
    logger.log("user1", "conn1", "hash1")
    logger.log("user2", "conn2", "hash2")
    # Directly corrupt user_id in first row — hash no longer matches
    logger._conn.execute("UPDATE audit_log SET user_id = 'HACKER' WHERE id = 1")
    logger._conn.commit()
    assert logger.verify_chain() is False


def test_verify_chain_tampered_hash(logger: AuditLogger) -> None:
    logger.log("user1", "conn1", "hash1")
    logger.log("user2", "conn2", "hash2")
    # Replace row_hash in first row with a bogus value
    logger._conn.execute("UPDATE audit_log SET row_hash = 'badhash' WHERE id = 1")
    logger._conn.commit()
    assert logger.verify_chain() is False


# ---------------------------------------------------------------------------
# export_csv()
# ---------------------------------------------------------------------------


def test_export_csv_empty(logger: AuditLogger) -> None:
    csv = logger.export_csv()
    lines = csv.strip().splitlines()
    # Only header
    assert len(lines) == 1


def test_export_csv_has_header(logger: AuditLogger) -> None:
    csv = logger.export_csv()
    assert csv.startswith("id,timestamp,")


def test_export_csv_rows(logger: AuditLogger) -> None:
    logger.log("user1", "conn1", "hash1")
    logger.log("user2", "conn2", "hash2")
    csv = logger.export_csv()
    lines = csv.strip().splitlines()
    # header + 2 data rows
    assert len(lines) == 3


# ---------------------------------------------------------------------------
# Determinism
# ---------------------------------------------------------------------------


def test_row_hash_deterministic(logger: AuditLogger) -> None:
    # Two independent loggers logging the exact same payload at the same
    # timestamp must produce the same hash.
    timestamp = "2026-04-02T00:00:00+00:00"
    user_id = "u1"
    connector_id = "c1"
    query_hash = "qhash"
    prev_hash = ""

    def compute(ts: str, uid: str, cid: str, qh: str, ph: str) -> str:
        data = f"{ts}{uid}{cid}{qh}{ph}"
        return hashlib.sha256(data.encode()).hexdigest()

    h1 = compute(timestamp, user_id, connector_id, query_hash, prev_hash)
    h2 = compute(timestamp, user_id, connector_id, query_hash, prev_hash)
    assert h1 == h2
