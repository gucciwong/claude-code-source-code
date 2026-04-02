import pytest
from messaging.command_processor import CommandProcessor


def test_help_returns_sovereign_code_header():
    proc = CommandProcessor()
    result = proc.process("help")
    assert "Sovereign Code Remote Commands" in result


def test_status_returns_running_locally():
    proc = CommandProcessor()
    result = proc.process("status")
    assert "Running locally" in result


def test_models_returns_installed_models():
    proc = CommandProcessor()
    result = proc.process("models")
    assert "Installed Models" in result


def test_metrics_returns_productivity_metrics():
    proc = CommandProcessor()
    result = proc.process("metrics")
    assert "Productivity Metrics" in result


def test_health_returns_service_health():
    proc = CommandProcessor()
    result = proc.process("health")
    assert "Service Health" in result


def test_chat_with_message_includes_message():
    proc = CommandProcessor()
    result = proc.process("chat Hello World")
    assert "Hello World" in result


def test_chat_alone_returns_usage_hint():
    proc = CommandProcessor()
    result = proc.process("chat ")
    assert "Usage" in result or "usage" in result


def test_unknown_command_returns_error_message():
    proc = CommandProcessor()
    result = proc.process("foobar")
    assert "Unknown command" in result
