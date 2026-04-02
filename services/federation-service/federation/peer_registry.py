from typing import Dict, List, Optional


class PeerRegistry:
    def __init__(self):
        self._peers: Dict[str, dict] = {}

    def register(self, peer: dict) -> None:
        self._peers[peer["peer_id"]] = dict(peer)

    def get(self, peer_id: str) -> Optional[dict]:
        return self._peers.get(peer_id)

    def list(self) -> List[dict]:
        return list(self._peers.values())

    def remove(self, peer_id: str) -> bool:
        if peer_id not in self._peers:
            return False
        del self._peers[peer_id]
        return True

    def count(self) -> int:
        return len(self._peers)
