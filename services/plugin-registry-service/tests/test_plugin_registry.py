import pytest
from registry.plugin_registry import PluginRegistry


SAMPLE_MANIFEST = {
    "id": "test-plugin",
    "name": "Test Plugin",
    "version": "1.0.0",
    "description": "A test plugin",
    "author": "Tester",
    "hooks": ["on_startup", "on_chat_message"],
    "enabled": True,
}


def make_registry():
    return PluginRegistry()


def test_register_adds_plugin():
    reg = make_registry()
    reg.register(SAMPLE_MANIFEST)
    assert reg.count() == 1


def test_get_returns_plugin_by_id():
    reg = make_registry()
    reg.register(SAMPLE_MANIFEST)
    result = reg.get("test-plugin")
    assert result is not None
    assert result["name"] == "Test Plugin"


def test_get_returns_none_for_unknown_id():
    reg = make_registry()
    result = reg.get("nonexistent")
    assert result is None


def test_list_returns_all_registered_plugins():
    reg = make_registry()
    reg.register(SAMPLE_MANIFEST)
    manifest2 = dict(SAMPLE_MANIFEST, id="plugin-2", name="Plugin 2")
    reg.register(manifest2)
    all_plugins = reg.list()
    assert len(all_plugins) == 2
    ids = {p["id"] for p in all_plugins}
    assert ids == {"test-plugin", "plugin-2"}


def test_remove_deletes_plugin_and_returns_true():
    reg = make_registry()
    reg.register(SAMPLE_MANIFEST)
    result = reg.remove("test-plugin")
    assert result is True
    assert reg.get("test-plugin") is None


def test_remove_returns_false_for_unknown_plugin():
    reg = make_registry()
    result = reg.remove("does-not-exist")
    assert result is False


def test_set_enabled_updates_flag_to_true():
    reg = make_registry()
    manifest = dict(SAMPLE_MANIFEST, enabled=False)
    reg.register(manifest)
    result = reg.set_enabled("test-plugin", True)
    assert result is True
    assert reg.get("test-plugin")["enabled"] is True


def test_set_enabled_updates_flag_to_false():
    reg = make_registry()
    reg.register(SAMPLE_MANIFEST)
    result = reg.set_enabled("test-plugin", False)
    assert result is True
    assert reg.get("test-plugin")["enabled"] is False


def test_get_plugins_for_hook_returns_only_subscribed_and_enabled():
    reg = make_registry()
    reg.register(SAMPLE_MANIFEST)  # hooks: on_startup, on_chat_message; enabled: True
    manifest_disabled = dict(SAMPLE_MANIFEST, id="disabled-plugin", enabled=False)
    reg.register(manifest_disabled)
    manifest_no_hook = dict(SAMPLE_MANIFEST, id="no-hook-plugin", hooks=["on_training_complete"])
    reg.register(manifest_no_hook)

    result = reg.get_plugins_for_hook("on_startup")
    ids = {p["id"] for p in result}
    assert "test-plugin" in ids
    assert "disabled-plugin" not in ids
    assert "no-hook-plugin" not in ids
