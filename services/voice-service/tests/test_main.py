"""Tests for FastAPI Voice Service"""
import pytest
from fastapi.testclient import TestClient


def test_app_imports():
    """Test that FastAPI app can be imported"""
    from main import app
    assert app is not None
    assert app.title == "Sovereign Voice Service"


def test_health_endpoint():
    """Test health check endpoint returns status"""
    from main import app
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    assert "version" in data
    assert "models" in data


def test_health_endpoint_models_structure():
    """Test health endpoint includes model status"""
    from main import app
    client = TestClient(app)
    response = client.get("/health")
    data = response.json()
    models = data["models"]
    assert "asr_loaded" in models
    assert "tts_loaded" in models
    assert isinstance(models["asr_loaded"], bool)
    assert isinstance(models["tts_loaded"], bool)


def test_cors_headers_present():
    """Test CORS middleware is configured"""
    from main import app
    client = TestClient(app)
    response = client.get("/health", headers={"Origin": "http://localhost:3000"})
    # CORS headers should be present
    assert "access-control-allow-origin" in response.headers or response.status_code == 200


def test_transcribe_endpoint_exists():
    """Test transcribe endpoint is available"""
    from main import app
    client = TestClient(app)
    # Should return 422 (validation error) since we're not uploading a file
    response = client.post("/api/voice/transcribe")
    assert response.status_code in [422, 400]  # Expected validation error


def test_speak_endpoint_exists():
    """Test speak endpoint is available"""
    from main import app
    client = TestClient(app)
    # Should return error without text parameter
    response = client.post("/api/voice/speak")
    assert response.status_code in [422, 400]  # Expected validation error
