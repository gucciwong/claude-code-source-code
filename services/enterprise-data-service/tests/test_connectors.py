"""
20 pytest tests for the Enterprise Data Service.

Run with:
    pytest tests/ -v
"""
from __future__ import annotations

import sys
import os

# Ensure the service root is on sys.path when running tests directly
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import xml.etree.ElementTree as ET

import pytest

from enterprise_data.connector import BaseConnector
from enterprise_data.connectors.postgres_connector import PostgresConnector
from enterprise_data.connectors.rest_connector import RestConnector
from enterprise_data.connectors.sap_connector import SAPConnector
from enterprise_data.connectors.salesforce_connector import SalesforceConnector
from enterprise_data.context_assembler import DataContextAssembler
from enterprise_data.registry import ConnectorRegistry


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _postgres_config() -> dict:
    return {"name": "Test PG", "type": "postgres", "connection_string": "", "enabled": True}


def _rest_config() -> dict:
    return {"name": "Test REST", "type": "rest", "base_url": "http://localhost", "enabled": True}


def _sap_config() -> dict:
    return {"name": "SAP ERP", "type": "sap", "enabled": True}


def _salesforce_config() -> dict:
    return {"name": "Salesforce CRM", "type": "salesforce", "enabled": True}


# ===========================================================================
# TestConnectorRegistry
# ===========================================================================


class TestConnectorRegistry:
    def test_register_postgres_connector(self) -> None:
        registry = ConnectorRegistry()
        result = registry.register(_postgres_config())

        assert "id" in result
        assert result["id"] != ""
        assert "createdAt" in result
        assert isinstance(result["createdAt"], int)
        assert result["createdAt"] > 0

    def test_register_rest_connector(self) -> None:
        registry = ConnectorRegistry()
        result = registry.register(_rest_config())

        assert result["type"] == "rest"
        assert result["name"] == "Test REST"
        assert "id" in result

    def test_list_connectors_empty(self) -> None:
        registry = ConnectorRegistry()
        assert registry.list_all() == []

    def test_list_connectors_multiple(self) -> None:
        registry = ConnectorRegistry()
        registry.register(_postgres_config())
        registry.register(_rest_config())
        connectors = registry.list_all()

        assert len(connectors) == 2

    def test_remove_connector(self) -> None:
        registry = ConnectorRegistry()
        stored = registry.register(_sap_config())
        removed = registry.remove(stored["id"])

        assert removed is True
        assert registry.list_all() == []

    def test_remove_nonexistent(self) -> None:
        registry = ConnectorRegistry()
        result = registry.remove("nonexistent-id")
        assert result is False

    def test_get_connector(self) -> None:
        registry = ConnectorRegistry()
        stored = registry.register(_salesforce_config())
        fetched = registry.get(stored["id"])

        assert fetched is not None
        assert fetched["id"] == stored["id"]
        assert fetched["type"] == "salesforce"

    def test_build_postgres_connector(self) -> None:
        registry = ConnectorRegistry()
        stored = registry.register(_postgres_config())
        connector = registry.build_connector(stored["id"])

        assert connector is not None
        assert isinstance(connector, PostgresConnector)


# ===========================================================================
# TestMockConnectors
# ===========================================================================


class TestMockConnectors:
    def test_sap_connector_query_returns_rows(self) -> None:
        connector = SAPConnector(_sap_config())
        rows = connector.query({})

        assert isinstance(rows, list)
        assert len(rows) > 0

    def test_sap_connector_schema(self) -> None:
        connector = SAPConnector(_sap_config())
        schema = connector.get_schema()

        assert isinstance(schema, list)
        assert len(schema) > 0
        for table in schema:
            assert "name" in table
            assert "columns" in table

    def test_salesforce_connector_query(self) -> None:
        connector = SalesforceConnector(_salesforce_config())
        rows = connector.query({})

        assert isinstance(rows, list)
        assert len(rows) > 0

    def test_salesforce_connector_schema(self) -> None:
        connector = SalesforceConnector(_salesforce_config())
        schema = connector.get_schema()

        assert isinstance(schema, list)
        assert len(schema) > 0
        for table in schema:
            assert "name" in table
            assert isinstance(table["columns"], list)

    def test_postgres_connector_query_no_connection(self) -> None:
        connector = PostgresConnector({"type": "postgres", "connection_string": ""})
        rows = connector.query({"sql": "SELECT 1"})

        # When psycopg2 is missing or connection fails, must return empty list
        assert isinstance(rows, list)

    def test_rest_connector_schema(self) -> None:
        connector = RestConnector(_rest_config())
        schema = connector.get_schema()

        assert schema == [{"name": "response", "columns": ["data"]}]

    def test_postgres_connector_schema_no_connection(self) -> None:
        connector = PostgresConnector({"type": "postgres", "connection_string": ""})
        schema = connector.get_schema()

        # Graceful degradation: returns list (possibly empty)
        assert isinstance(schema, list)

    def test_build_sap_connector(self) -> None:
        registry = ConnectorRegistry()
        stored = registry.register(_sap_config())
        connector = registry.build_connector(stored["id"])

        assert connector is not None
        assert isinstance(connector, SAPConnector)


# ===========================================================================
# TestContextAssembler
# ===========================================================================


class TestContextAssembler:
    def test_build_context_empty_connectors(self) -> None:
        registry = ConnectorRegistry()
        assembler = DataContextAssembler(registry)
        xml_str = assembler.build_context("summarise orders", [])

        assert "<enterprise_context" in xml_str
        # No connector elements expected
        root = ET.fromstring(xml_str)
        assert len(list(root)) == 0

    def test_build_context_with_sap(self) -> None:
        registry = ConnectorRegistry()
        stored = registry.register(_sap_config())
        assembler = DataContextAssembler(registry)
        xml_str = assembler.build_context("list open orders", [stored["id"]])

        assert "<enterprise_context" in xml_str
        assert "<connector" in xml_str

    def test_build_context_xml_valid(self) -> None:
        registry = ConnectorRegistry()
        stored = registry.register(_sap_config())
        assembler = DataContextAssembler(registry)
        xml_str = assembler.build_context("test", [stored["id"]])

        # Must parse without raising
        root = ET.fromstring(xml_str)
        assert root.tag == "enterprise_context"

    def test_build_context_uses_connector_name(self) -> None:
        registry = ConnectorRegistry()
        stored = registry.register({"name": "My SAP System", "type": "sap", "enabled": True})
        assembler = DataContextAssembler(registry)
        xml_str = assembler.build_context("test", [stored["id"]])

        assert "My SAP System" in xml_str
