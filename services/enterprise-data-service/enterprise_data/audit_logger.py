from __future__ import annotations

import csv
import hashlib
import io
import sqlite3
from datetime import datetime, timezone


class AuditLogger:
    """
    Append-only SQLite audit logger with SHA-256 hash chaining.

    Each row stores a *row_hash* that is the SHA-256 of its own fields
    concatenated with the *row_hash* of the immediately preceding row
    (or the empty string for the very first row).  This enables
    tamper-detection via :meth:`verify_chain`.
    """

    def __init__(self, db_path: str = ":memory:") -> None:
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_db()

    # ------------------------------------------------------------------
    # Schema
    # ------------------------------------------------------------------

    def _init_db(self) -> None:
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_log (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp           TEXT    NOT NULL,
                user_id             TEXT    NOT NULL,
                connector_id        TEXT    NOT NULL,
                query_hash          TEXT    NOT NULL,
                rows_returned       INTEGER NOT NULL DEFAULT 0,
                pii_entities_masked INTEGER NOT NULL DEFAULT 0,
                prev_hash           TEXT,
                row_hash            TEXT    NOT NULL
            )
            """
        )
        self._conn.commit()

    # ------------------------------------------------------------------
    # Hash helpers
    # ------------------------------------------------------------------

    def _compute_hash(
        self,
        timestamp: str,
        user_id: str,
        connector_id: str,
        query_hash: str,
        prev_hash: str,
    ) -> str:
        data = f"{timestamp}{user_id}{connector_id}{query_hash}{prev_hash}"
        return hashlib.sha256(data.encode()).hexdigest()

    def _get_last_row_hash(self) -> str:
        cur = self._conn.execute(
            "SELECT row_hash FROM audit_log ORDER BY id DESC LIMIT 1"
        )
        row = cur.fetchone()
        return row["row_hash"] if row else ""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def log(
        self,
        user_id: str,
        connector_id: str,
        query_hash: str,
        rows_returned: int = 0,
        pii_entities_masked: int = 0,
    ) -> int:
        """Append a new audit entry. Returns the new row id."""
        timestamp = datetime.now(timezone.utc).isoformat()
        prev_hash = self._get_last_row_hash()
        row_hash = self._compute_hash(
            timestamp, user_id, connector_id, query_hash, prev_hash
        )
        cur = self._conn.execute(
            """
            INSERT INTO audit_log
                (timestamp, user_id, connector_id, query_hash,
                 rows_returned, pii_entities_masked, prev_hash, row_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                timestamp,
                user_id,
                connector_id,
                query_hash,
                rows_returned,
                pii_entities_masked,
                prev_hash,
                row_hash,
            ),
        )
        self._conn.commit()
        return cur.lastrowid  # type: ignore[return-value]

    def get_all(self) -> list[dict]:
        """Return all audit entries as a list of dicts (ascending by id)."""
        cur = self._conn.execute(
            "SELECT * FROM audit_log ORDER BY id ASC"
        )
        return [dict(row) for row in cur.fetchall()]

    def verify_chain(self) -> bool:
        """
        Validate the hash chain.

        Returns ``True`` if every row_hash matches the value recomputed from
        stored fields and the chain of prev_hashes is consistent.
        Returns ``True`` for an empty log.
        """
        rows = self.get_all()
        if not rows:
            return True

        prev_row_hash = ""
        for row in rows:
            # Verify the stored prev_hash links to the previous entry
            if row["prev_hash"] != prev_row_hash:
                return False

            # Recompute the hash from stored fields
            expected = self._compute_hash(
                row["timestamp"],
                row["user_id"],
                row["connector_id"],
                row["query_hash"],
                row["prev_hash"],
            )
            if expected != row["row_hash"]:
                return False

            prev_row_hash = row["row_hash"]

        return True

    def export_csv(self) -> str:
        """Return all rows as a CSV string (header + data rows)."""
        rows = self.get_all()
        output = io.StringIO()
        fieldnames = [
            "id",
            "timestamp",
            "user_id",
            "connector_id",
            "query_hash",
            "rows_returned",
            "pii_entities_masked",
            "prev_hash",
            "row_hash",
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
        return output.getvalue()
