from abc import ABC, abstractmethod
from typing import Any


class BaseConnector(ABC):
    def __init__(self, config: dict) -> None:
        self.config = config

    @abstractmethod
    def query(self, params: dict) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    def get_schema(self) -> list[dict]:
        ...

    @property
    def connector_type(self) -> str:
        return self.config.get("type", "unknown")
