from typing import Dict, List, Optional


class PluginRegistry:
    def __init__(self):
        self._plugins: Dict[str, dict] = {}

    def register(self, manifest: dict) -> None:
        self._plugins[manifest["id"]] = dict(manifest)

    def get(self, plugin_id: str) -> Optional[dict]:
        return self._plugins.get(plugin_id)

    def list(self) -> List[dict]:
        return list(self._plugins.values())

    def remove(self, plugin_id: str) -> bool:
        if plugin_id not in self._plugins:
            return False
        del self._plugins[plugin_id]
        return True

    def set_enabled(self, plugin_id: str, enabled: bool) -> bool:
        if plugin_id not in self._plugins:
            return False
        self._plugins[plugin_id]["enabled"] = enabled
        return True

    def get_plugins_for_hook(self, hook: str) -> List[dict]:
        return [
            p for p in self._plugins.values()
            if p.get("enabled", True) and hook in p.get("hooks", [])
        ]

    def count(self) -> int:
        return len(self._plugins)
