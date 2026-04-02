from pydantic import BaseModel
from typing import List, Optional


class PeerInfo(BaseModel):
    peer_id: str
    address: str
    data_size: int = 100


class GradientUpdate(BaseModel):
    peer_id: str
    round_id: str
    gradients: List[float]
    data_size: int


class FederationRound(BaseModel):
    round_id: str
    status: str = "collecting"  # "collecting" | "aggregating" | "complete"
    participating_peers: List[str] = []
    submitted_peers: List[str] = []
    aggregated_gradients: Optional[List[float]] = None
    dp_noise_applied: bool = False
