import pytest
from registry.plugin_registry import PluginRegistry
from registry.hook_dispatcher import HookDispatcher


PLUGIN_A = {
    "id": "plugin-a",
    "name": "Plugin A",
    "version": "1.0.0",
    "description": "Plugin A",
    "author": "Dev",
    "hooks": ["on_startup", "on_chat_message"],
    "enabled": True,
}

PLUGIN_B = {
    "id": "plugin-b",
    "name": "Plugin B",
    "version": "1.0.0",
    "description": "Plugin B",
    "author": "Dev",
    "hooks": ["on_chat_message"],
    "enabled": True,
}

PLUGIN_DISABLED = {
    "id": "plugin-disabled",
    "name": "Plugin Disabled",
    "version": "1.0.0",
    "description": "Disabled",
    "author": "Dev",
    "hooks": ["on_startup"],
    "enabled": False,
}


def make_dispatcher():
    reg = PluginRegistry()
    return reg, HookDispatcher(reg)


def test_dispatch_returns_empty_when_no_plugins_subscribed():
    reg, dispatcher = make_dispatcher()
    result = dispatcher.dispatch("on_startup", {})
    assert result == []


def test_dispatch_returns_plugin_ids_subscribed_to_hook():
    reg, dispatcher = make_dispatcher()
    reg.register(PLUGIN_A)
    reg.register(PLUGIN_B)
    result = dispatcher.dispatch("on_startup", {})
    assert "plugin-a" in result
    assert "plugin-b" not in result


def test_dispatch_disabled_plugins_not_included():
    reg, dispatcher = make_dispatcher()
    reg.register(PLUGIN_A)
    reg.register(PLUGIN_DISABLED)
    result = dispatcher.dispatch("on_startup", {})
    assert "plugin-a" in result
    assert "plugin-disabled" not in result


def test_dispatch_appends_to_dispatch_log():
    reg, dispatcher = make_dispatcher()
    reg.register(PLUGIN_A)
    dispatcher.dispatch("on_startup", {"key": "value"})
    log = dispatcher.get_dispatch_log()
    assert len(log) == 1


def test_dispatch_log_entry_has_correct_keys():
    reg, dispatcher = make_dispatcher()
    reg.register(PLUGIN_A)
    dispatcher.dispatch("on_chat_message", {"msg": "hello"})
    log = dispatcher.get_dispatch_log()
    entry = log[0]
    assert "hook" in entry
    assert "payload" in entry
    assert "handlers" in entry
    assert entry["hook"] == "on_chat_message"
    assert entry["payload"] == {"msg": "hello"}


def test_get_registered_hooks_includes_known_hooks():
    _, dispatcher = make_dispatcher()
    hooks = dispatcher.get_registered_hooks()
    assert "on_startup" in hooks
    assert "on_chat_message" in hooks


def test_multiple_dispatches_accumulate_in_log():
    reg, dispatcher = make_dispatcher()
    reg.register(PLUGIN_A)
    dispatcher.dispatch("on_startup", {})
    dispatcher.dispatch("on_chat_message", {"text": "hi"})
    dispatcher.dispatch("on_code_review", {})
    log = dispatcher.get_dispatch_log()
    assert len(log) == 3
