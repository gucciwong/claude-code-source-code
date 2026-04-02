from __future__ import annotations

from typing import Any

from enterprise_data.connector import BaseConnector

_SAMPLE_ORDERS = [
    {"order_id": "SAP-0001", "customer": "Acme Corp", "amount": 15000.00, "currency": "USD"},
    {"order_id": "SAP-0002", "customer": "Beta GmbH", "amount": 8200.50, "currency": "EUR"},
    {"order_id": "SAP-0003", "customer": "Gamma Ltd", "amount": 3750.00, "currency": "GBP"},
]

_SAMPLE_MATERIALS = [
    {"material_id": "MAT-001", "description": "Steel Rod 10mm", "stock": 500, "unit": "PCS"},
    {"material_id": "MAT-002", "description": "Aluminium Sheet", "stock": 120, "unit": "M2"},
]


class SAPConnector(BaseConnector):
    """SAP mock connector — returns hardcoded sample data for demo/testing purposes."""

    def query(self, params: dict) -> list[dict[str, Any]]:
        entity = params.get("entity", "orders").lower()
        if entity == "materials":
            return list(_SAMPLE_MATERIALS)
        return list(_SAMPLE_ORDERS)

    def get_schema(self) -> list[dict]:
        return [
            {"name": "orders", "columns": ["order_id", "customer", "amount", "currency"]},
            {"name": "materials", "columns": ["material_id", "description", "stock", "unit"]},
        ]
