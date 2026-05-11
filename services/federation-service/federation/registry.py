"""W6-T16b — Federation service singletons.

`FED_PEER_DB_PATH` (env) → persistent SQLite peer registry.
Unset → in-memory only (test default + backward-compat).
"""
import os
from pathlib import Path

from .peer_registry import PeerRegistry
from .differential_privacy import DifferentialPrivacy
from .fed_avg import FedAvgAggregator
from .round_manager import FederationRoundManager

_DB_PATH_ENV = os.getenv("FED_PEER_DB_PATH", "").strip()
_db_path = Path(_DB_PATH_ENV) if _DB_PATH_ENV else None

peer_registry = PeerRegistry(db_path=_db_path)
fed_aggregator = FedAvgAggregator()
round_manager = FederationRoundManager()
