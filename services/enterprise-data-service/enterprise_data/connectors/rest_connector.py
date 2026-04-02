from __future__ import annotations

from typing import Any

import httpx

from enterprise_data.connector import BaseConnector


class RestConnector(BaseConnector):
    """HTTP REST connector.  Supports GET and POST via params["method"]."""

    def query(self, params: dict) -> list[dict[str, Any]]:
        base_url: str = self.config.get("base_url", "")
        endpoint: str = params.get("endpoint", "")
        method: str = params.get("method", "GET").upper()
        headers: dict = {**self.config.get("headers", {}), **params.get("headers", {})}
        body: dict | None = params.get("body")

        url = base_url.rstrip("/") + ("/" + endpoint.lstrip("/") if endpoint else "")
        try:
            with httpx.Client(timeout=10) as client:
                if method == "POST":
                    resp = client.post(url, headers=headers, json=body)
                else:
                    resp = client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list):
                return data
            return [data]
        except Exception:
            return []

    def get_schema(self) -> list[dict]:
        return [{"name": "response", "columns": ["data"]}]
