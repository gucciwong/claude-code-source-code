from typing import Dict, Optional, List, Any


class PlatformRegistry:
    """Stores configured IM platform connections."""

    def __init__(self):
        self._configs: Dict[str, Dict[str, Any]] = {}

    def configure(self, config: Dict[str, Any]) -> None:
        platform = config["platform"]
        self._configs[platform] = config

    def get(self, platform: str) -> Optional[Dict[str, Any]]:
        return self._configs.get(platform)

    def list(self) -> List[Dict[str, Any]]:
        return list(self._configs.values())

    def remove(self, platform: str) -> bool:
        if platform in self._configs:
            del self._configs[platform]
            return True
        return False

    def clear(self) -> None:
        self._configs.clear()

    def is_authorized(self, platform: str, sender_id: str) -> bool:
        config = self.get(platform)
        if not config:
            return False
        allowed = config.get("allowed_user_ids", [])
        if not allowed:
            return True  # open platform — no allowlist configured
        return sender_id in allowed
