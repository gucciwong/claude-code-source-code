from __future__ import annotations

import logging
import re
from typing import Any

from enterprise_data.connector import BaseConnector

logger = logging.getLogger(__name__)

_SAFE_SQL_RE = re.compile(r"^\s*SELECT\b", re.IGNORECASE)


class PostgresConnector(BaseConnector):
    """PostgreSQL connector.  Requires psycopg2 at runtime; degrades gracefully if absent."""

    def query(self, params: dict) -> list[dict[str, Any]]:
        try:
            import psycopg2  # type: ignore[import]
            import psycopg2.extras  # type: ignore[import]
        except ImportError:
            return []

        sql = params.get("sql", "")
        if not sql:
            return []

        # Only allow SELECT statements to prevent SQL injection via read-path abuse
        if not _SAFE_SQL_RE.match(sql):
            logger.warning("Blocked non-SELECT query in PostgresConnector.query")
            return []

        try:
            conn = psycopg2.connect(self.config.get("connection_string", ""))
            conn.set_session(readonly=True)
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql)
                rows = [dict(row) for row in cur.fetchall()]
            conn.close()
            return rows
        except Exception:
            logger.exception("PostgresConnector.query failed")
            return []

    def get_schema(self) -> list[dict]:
        try:
            import psycopg2  # type: ignore[import]
            import psycopg2.extras  # type: ignore[import]
        except ImportError:
            return []

        try:
            conn = psycopg2.connect(self.config.get("connection_string", ""))
            conn.set_session(readonly=True)
            sql = """
                SELECT
                    t.table_name,
                    c.column_name
                FROM information_schema.tables t
                JOIN information_schema.columns c
                    ON c.table_name = t.table_name
                    AND c.table_schema = t.table_schema
                WHERE t.table_schema = 'public'
                ORDER BY t.table_name, c.ordinal_position
            """
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql)
                raw = cur.fetchall()
            conn.close()

            tables: dict[str, list[str]] = {}
            for row in raw:
                tname = row["table_name"]
                tables.setdefault(tname, []).append(row["column_name"])

            return [{"name": t, "columns": cols} for t, cols in tables.items()]
        except Exception:
            logger.exception("PostgresConnector.get_schema failed")
            return []
