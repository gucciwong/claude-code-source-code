import pytest
from fastapi.testclient import TestClient
from main import app
from messaging.registry import platform_registry, command_processor


@pytest.fixture(autouse=True)
def clean_state():
    """Reset shared state between tests."""
    platform_registry.clear()
    command_processor.clear_log()
    yield
    platform_registry.clear()
    command_processor.clear_log()


client = TestClient(app)


def test_configure_platform_returns_ok():
    response = client.post("/platforms/configure", json={
        "platform": "telegram",
        "allowed_user_ids": [],
        "enabled": True,
    })
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["platform"] == "telegram"


def test_list_platforms_returns_configured():
    client.post("/platforms/configure", json={
        "platform": "slack",
        "allowed_user_ids": [],
        "enabled": True,
    })
    response = client.get("/platforms")
    assert response.status_code == 200
    platforms = response.json()
    assert any(p["platform"] == "slack" for p in platforms)


def test_delete_platform_removes_it():
    client.post("/platforms/configure", json={
        "platform": "discord",
        "allowed_user_ids": [],
        "enabled": True,
    })
    response = client.delete("/platforms/discord")
    assert response.status_code == 200
    assert response.json()["removed"] == "discord"
    # Verify it's gone
    list_response = client.get("/platforms")
    assert not any(p["platform"] == "discord" for p in list_response.json())


def test_webhook_unauthorized_sender_returns_403():
    client.post("/platforms/configure", json={
        "platform": "feishu",
        "allowed_user_ids": ["allowed_user"],
        "enabled": True,
    })
    response = client.post("/webhooks/feishu", json={
        "sender_id": "unauthorized_user",
        "text": "status",
        "platform": "feishu",
    })
    assert response.status_code == 403


def test_health_returns_ok_with_platform_count():
    client.post("/platforms/configure", json={
        "platform": "line",
        "allowed_user_ids": [],
        "enabled": True,
    })
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["platforms_configured"] >= 1
