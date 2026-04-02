import uuid
from typing import List, Optional, Dict
from .models import FederationRound, GradientUpdate
from .fed_avg import FedAvgAggregator
from .differential_privacy import DifferentialPrivacy


class FederationRoundManager:
    def __init__(self):
        self._rounds: Dict[str, FederationRound] = {}
        self._current_round_id: Optional[str] = None
        self._updates: Dict[str, list] = {}  # round_id -> list of updates
        self._dp = DifferentialPrivacy()
        self._aggregator = FedAvgAggregator(dp=self._dp, apply_dp=False)

    def start_round(self, peers: List[dict]) -> dict:
        round_id = str(uuid.uuid4())
        round_obj = FederationRound(
            round_id=round_id,
            participating_peers=[p["peer_id"] for p in peers],
        )
        self._rounds[round_id] = round_obj
        self._updates[round_id] = []
        self._current_round_id = round_id
        return round_obj.dict()

    def submit_update(self, update: dict) -> Optional[dict]:
        round_id = update.get("round_id")
        if round_id not in self._rounds:
            return None
        round_obj = self._rounds[round_id]
        if round_obj.status == "complete":
            return None

        self._updates[round_id].append(update)
        round_obj.submitted_peers.append(update["peer_id"])

        # Auto-aggregate when all peers have submitted
        if (set(round_obj.submitted_peers) >= set(round_obj.participating_peers)
                and round_obj.participating_peers):
            self._finalize_round(round_id)

        return round_obj.dict()

    def _finalize_round(self, round_id: str) -> None:
        round_obj = self._rounds[round_id]
        updates = self._updates[round_id]
        agg = self._aggregator.aggregate(updates)
        round_obj.aggregated_gradients = agg
        round_obj.status = "complete"
        round_obj.dp_noise_applied = self._aggregator._apply_dp

    def get_current_round(self) -> Optional[dict]:
        if not self._current_round_id:
            return None
        return self._rounds[self._current_round_id].dict()

    def history(self) -> list:
        return [r.dict() for r in self._rounds.values()]

    def count_rounds(self) -> int:
        return len(self._rounds)
