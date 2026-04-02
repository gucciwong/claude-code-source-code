import pytest
from messaging.platform_registry import PlatformRegistry


def test_configure_stores_platform():
    reg = PlatformRegistry()
    reg.configure({"platform": "telegram", "enabled": True, "allowed_user_ids": []})
    assert reg.get("telegram") is not None


def test_get_returns_config_and_none_for_unknown():
    reg = PlatformRegistry()
    reg.configure({"platform": "slack", "bot_token": "xoxb-123", "allowed_user_ids": []})
    config = reg.get("slack")
    assert config["bot_token"] == "xoxb-123"
    assert reg.get("unknown_platform") is None


def test_list_returns_all_platforms():
    reg = PlatformRegistry()
    reg.configure({"platform": "telegram", "allowed_user_ids": []})
    reg.configure({"platform": "slack", "allowed_user_ids": []})
    platforms = reg.list()
    assert len(platforms) == 2


def test_remove_returns_true_and_deletes():
    reg = PlatformRegistry()
    reg.configure({"platform": "discord", "allowed_user_ids": []})
    result = reg.remove("discord")
    assert result is True
    assert reg.get("discord") is None


def test_remove_returns_false_for_nonexistent():
    reg = PlatformRegistry()
    result = reg.remove("nonexistent")
    assert result is False


def test_is_authorized_empty_allowlist():
    reg = PlatformRegistry()
    reg.configure({"platform": "telegram", "allowed_user_ids": []})
    assert reg.is_authorized("telegram", "anyone") is True


def test_is_authorized_sender_in_allowlist():
    reg = PlatformRegistry()
    reg.configure({"platform": "slack", "allowed_user_ids": ["user123"]})
    assert reg.is_authorized("slack", "user123") is True
    assert reg.is_authorized("slack", "hacker") is False
