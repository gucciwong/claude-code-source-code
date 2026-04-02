from .peer_registry import PeerRegistry
from .differential_privacy import DifferentialPrivacy
from .fed_avg import FedAvgAggregator
from .round_manager import FederationRoundManager

peer_registry = PeerRegistry()
fed_aggregator = FedAvgAggregator()
round_manager = FederationRoundManager()
