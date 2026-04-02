import pytest
from fastapi.testclient import TestClient


SAMPLE_MANIFEST = {
    "id": "api-test-plugin",
    "name": "API Test Plugin",
    "version": "2.0.0",
    "description": "Plugin for API testing",
    "author": "API Tester",
    "hooks": ["on_startup"],
    "enabled": True,
}


@pytest.fixture
def client():
    # Import here so registry is fresh for each test
    from registry.registry import plugin_registry, hook_dispatcher
    plugin_registry._plugins.clear()
    from main import app
    return TestClient(app)


def test_register_plugin_returns_200(client):
    response = client.post("/plugins/register", json=SAMPLE_MANIFEST)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["plugin_id"] == "api-test-plugin"


def test_list_plugins_returns_registered_plugins(client):
    client.post("/plugins/register", json=SAMPLE_MANIFEST)
    response = client.get("/plugins")
    assert response.status_code == 200
    plugins = response.json()
    assert any(p["id"] == "api-test-plugin" for p in plugins)


def test_delete_plugin_removes_it(client):
    client.post("/plugins/register", json=SAMPLE_MANIFEST)
    response = client.delete(f"/plugins/{SAMPLE_MANIFEST['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_delete_unknown_plugin_returns_404(client):
    response = client.delete("/plugins/nonexistent-plugin-xyz")
    assert response.status_code == 404


def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
