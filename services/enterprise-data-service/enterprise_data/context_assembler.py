from __future__ import annotations

import xml.etree.ElementTree as ET

from enterprise_data.registry import ConnectorRegistry


class DataContextAssembler:
    def __init__(self, registry: ConnectorRegistry) -> None:
        self._registry = registry

    def build_context(self, prompt: str, connector_ids: list[str]) -> str:
        root = ET.Element("enterprise_context")

        for cid in connector_ids:
            config = self._registry.get(cid)
            if config is None:
                continue

            connector = self._registry.build_connector(cid)
            if connector is None:
                continue

            connector_el = ET.SubElement(
                root,
                "connector",
                attrib={
                    "id": cid,
                    "name": config.get("name", ""),
                    "type": config.get("type", ""),
                },
            )

            try:
                rows = connector.query({})
            except Exception:
                rows = []

            for row in rows:
                row_el = ET.SubElement(connector_el, "row")
                for key, value in row.items():
                    row_el.set(str(key), str(value))

        return ET.tostring(root, encoding="unicode")
