from __future__ import annotations

import time
import uuid
from typing import TYPE_CHECKING

from enterprise_data.connector import BaseConnector
from enterprise_data.connectors.postgres_connector import PostgresConnector
from enterprise_data.connectors.rest_connector import RestConnector
from enterprise_data.connectors.sap_connector import SAPConnector
from enterprise_data.connectors.salesforce_connector import SalesforceConnector

_CONNECTOR_MAP: dict[str, type[BaseConnector]] = {
    "postgres": PostgresConnector,
    "rest": RestConnector,
    "sap": SAPConnector,
    "salesforce": SalesforceConnector,
}


class ConnectorRegistry:
    def __init__(self) -> None:
        self._connectors: dict[str, dict] = {}  # id → config dict

    def register(self, config: dict) -> dict:
        connector_id = str(uuid.uuid4())
        created_at = int(time.time() * 1000)
        stored = {**config, "id": connector_id, "createdAt": created_at}
        self._connectors[connector_id] = stored
        return stored

    def list_all(self) -> list[dict]:
        return list(self._connectors.values())

    def remove(self, connector_id: str) -> bool:
        if connector_id not in self._connectors:
            return False
        del self._connectors[connector_id]
        return True

    def get(self, connector_id: str) -> dict | None:
        return self._connectors.get(connector_id)

    def build_connector(self, connector_id: str) -> BaseConnector | None:
        config = self.get(connector_id)
        if config is None:
            return None
        connector_type = config.get("type", "")
        cls = _CONNECTOR_MAP.get(connector_type)
        if cls is None:
            return None
        return cls(config)
