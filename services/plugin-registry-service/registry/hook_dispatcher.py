from typing import List
from .plugin_registry import PluginRegistry

BUILTIN_HOOKS = ["on_startup", "on_chat_message", "on_code_review", "on_training_complete", "on_search_query"]


class HookDispatcher:
    def __init__(self, registry: PluginRegistry):
        self._registry = registry
        self._dispatched: list = []  # log for tests

    def dispatch(self, hook: str, payload: dict) -> List[str]:
        """Returns IDs of plugins that handle this hook."""
        handlers = self._registry.get_plugins_for_hook(hook)
        plugin_ids = [p["id"] for p in handlers]
        self._dispatched.append({"hook": hook, "payload": payload, "handlers": plugin_ids})
        return plugin_ids

    def get_registered_hooks(self) -> List[str]:
        return BUILTIN_HOOKS

    def get_dispatch_log(self) -> list:
        return list(self._dispatched)
