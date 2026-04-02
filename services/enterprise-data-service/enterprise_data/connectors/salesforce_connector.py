from __future__ import annotations

from typing import Any

from enterprise_data.connector import BaseConnector

_SAMPLE_ACCOUNTS = [
    {"Id": "001000000001", "Name": "Initech Inc.", "Type": "Customer", "AnnualRevenue": 5000000},
    {"Id": "001000000002", "Name": "Umbrella Corp", "Type": "Partner", "AnnualRevenue": 12000000},
]

_SAMPLE_OPPORTUNITIES = [
    {"Id": "006000000001", "Name": "Q1 Renewal", "StageName": "Closed Won", "Amount": 45000},
    {"Id": "006000000002", "Name": "Expansion Deal", "StageName": "Negotiation", "Amount": 120000},
]


class SalesforceConnector(BaseConnector):
    """Salesforce mock connector — returns hardcoded sample data for demo/testing purposes."""

    def query(self, params: dict) -> list[dict[str, Any]]:
        sobject = params.get("sobject", "Account").lower()
        if sobject == "opportunity":
            return list(_SAMPLE_OPPORTUNITIES)
        return list(_SAMPLE_ACCOUNTS)

    def get_schema(self) -> list[dict]:
        return [
            {"name": "Account", "columns": ["Id", "Name", "Type", "AnnualRevenue"]},
            {"name": "Opportunity", "columns": ["Id", "Name", "StageName", "Amount"]},
        ]
