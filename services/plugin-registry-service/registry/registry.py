from .plugin_registry import PluginRegistry
from .hook_dispatcher import HookDispatcher

plugin_registry = PluginRegistry()
hook_dispatcher = HookDispatcher(plugin_registry)
