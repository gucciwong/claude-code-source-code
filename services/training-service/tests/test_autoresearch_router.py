"""
Tests for ResearchProgram FastAPI Router (Phase 4.3 - Router)

Tests all endpoints for research program management: CRUD, status transitions, start/stop.
"""

import pytest
from pathlib import Path
import tempfile

from fastapi import FastAPI
from fastapi.testclient import TestClient

from autoresearch.program import ResearchProgram, SearchDimension, DEFAULT_PROGRAMS
from autoresearch.store import ResearchProgramStore
from autoresearch.router import router, set_store


@pytest.fixture
def app_and_store():
    """Create FastAPI app with research program router and store"""
    app = FastAPI()
    
    # Create temp store
    tmpdir = tempfile.TemporaryDirectory()
    store = ResearchProgramStore(db_dir=Path(tmpdir.name))
    
    # Setup router
    set_store(store)
    app.include_router(router)
    
    yield app, store
    
    # Cleanup
    tmpdir.cleanup()


@pytest.fixture
def client(app_and_store):
    """FastAPI test client"""
    app, _ = app_and_store
    return TestClient(app)


@pytest.fixture
def store(app_and_store):
    """ResearchProgramStore instance"""
    _, store = app_and_store
    return store


class TestCreateResearchProgram:
    """Test POST /api/v1/research/programs"""
    
    def test_create_program_returns_201(self, client):
        """Create should return 201 Created"""
        request_data = {
            "run_tag": "test-run",
            "goal": "Test goal",
            "primary_metric": "val_loss",
            "time_budget_seconds": 300,
            "base_model": "test-model",
            "dataset_path": "/data/test",
            "search_dimensions": [
                {
                    "name": "param1",
                    "type": "int",
                    "min_val": 1.0,
                    "max_val": 10.0,
                    "current": 5
                }
            ]
        }
        
        response = client.post("/api/v1/research/programs", json=request_data)
        
        assert response.status_code == 201
    
    def test_create_program_returns_resource(self, client):
        """Create should return the created ResearchProgram"""
        request_data = {
            "run_tag": "test-run",
            "goal": "Test goal",
            "primary_metric": "val_loss",
            "time_budget_seconds": 300,
            "base_model": "test-model",
            "dataset_path": "/data/test",
            "search_dimensions": [
                {
                    "name": "param1",
                    "type": "int",
                    "min_val": 1.0,
                    "max_val": 10.0,
                    "current": 5
                }
            ]
        }
        
        response = client.post("/api/v1/research/programs", json=request_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["run_tag"] == "test-run"
        assert data["goal"] == "Test goal"
        assert data["status"] == "pending"
        assert "id" in data
    
    def test_create_program_missing_required_field(self, client):
        """Create should fail if required field missing"""
        request_data = {
            "run_tag": "test-run",
            # Missing goal, primary_metric, etc.
            "search_dimensions": []
        }
        
        response = client.post("/api/v1/research/programs", json=request_data)
        
        assert response.status_code == 422  # Validation error


class TestListResearchPrograms:
    """Test GET /api/v1/research/programs"""
    
    def test_list_programs_returns_200(self, client, store):
        """List should return 200 OK"""
        # Create a program first
        program = DEFAULT_PROGRAMS["quick-explore"]
        store.create(program)
        
        response = client.get("/api/v1/research/programs")
        
        assert response.status_code == 200
    
    def test_list_programs_returns_array(self, client, store):
        """List should return array of programs"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        store.create(program)
        
        response = client.get("/api/v1/research/programs")
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert isinstance(data["items"], list)
    
    def test_list_programs_empty(self, client):
        """List should return empty items if no programs"""
        response = client.get("/api/v1/research/programs")
        
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
    
    def test_list_programs_pagination(self, client, store):
        """List should support limit and offset parameters"""
        # Create 5 programs
        for i in range(5):
            program = ResearchProgram(
                run_tag=f"prog-{i}",
                goal=f"Goal {i}",
                description=f"Desc {i}",
                primary_metric="val_loss",
                time_budget_seconds=300,
                base_model="test",
                dataset_path="/data",
                search_dimensions=[
                    SearchDimension(
                        name="x",
                        type="int",
                        min_val=1.0,
                        max_val=10.0,
                        current=5
                    )
                ]
            )
            store.create(program)
        
        # Test limit and offset
        response = client.get("/api/v1/research/programs?limit=2&offset=0")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["limit"] == 2
        assert data["offset"] == 0
        assert data["total"] == 5
    
    def test_list_programs_default_pagination(self, client, store):
        """List should use default limit=100, offset=0"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        store.create(program)
        
        response = client.get("/api/v1/research/programs")
        
        data = response.json()
        assert data["limit"] == 100
        assert data["offset"] == 0


class TestGetResearchProgram:
    """Test GET /api/v1/research/programs/{id}"""
    
    def test_get_program_returns_200(self, client, store):
        """Get should return 200 OK if found"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.get(f"/api/v1/research/programs/{created.id}")
        
        assert response.status_code == 200
    
    def test_get_program_returns_resource(self, client, store):
        """Get should return the program details"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.get(f"/api/v1/research/programs/{created.id}")
        
        data = response.json()
        assert data["id"] == created.id
        assert data["run_tag"] == "quick-explore"
        assert data["status"] == "pending"
    
    def test_get_program_not_found_returns_404(self, client):
        """Get should return 404 if program not found"""
        response = client.get("/api/v1/research/programs/non-existent-id")
        
        assert response.status_code == 404


class TestUpdateResearchProgram:
    """Test PATCH /api/v1/research/programs/{id}"""
    
    def test_update_status_returns_200(self, client, store):
        """Update should return 200 OK on success"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.patch(
            f"/api/v1/research/programs/{created.id}",
            json={"status": "running"}
        )
        
        assert response.status_code == 200
    
    def test_update_status_changes_value(self, client, store):
        """Update should change the status field"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.patch(
            f"/api/v1/research/programs/{created.id}",
            json={"status": "running"}
        )
        
        data = response.json()
        assert data["status"] == "running"
    
    def test_update_invalid_status_returns_400(self, client, store):
        """Update should reject invalid status values"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.patch(
            f"/api/v1/research/programs/{created.id}",
            json={"status": "invalid-status"}
        )
        
        assert response.status_code == 422  # Validation error from Pydantic
    
    def test_update_not_found_returns_404(self, client):
        """Update should return 404 if program not found"""
        response = client.patch(
            "/api/v1/research/programs/non-existent-id",
            json={"status": "running"}
        )
        
        assert response.status_code == 404
    
    def test_update_status_pending_to_running(self, client, store):
        """Status transition: pending → running"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.patch(
            f"/api/v1/research/programs/{created.id}",
            json={"status": "running"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
    
    def test_update_status_running_to_completed(self, client, store):
        """Status transition: running → completed"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        store.update(created.id, status="running")
        
        response = client.patch(
            f"/api/v1/research/programs/{created.id}",
            json={"status": "completed"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
    
    def test_update_status_running_to_stopped(self, client, store):
        """Status transition: running → stopped"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        store.update(created.id, status="running")
        
        response = client.patch(
            f"/api/v1/research/programs/{created.id}",
            json={"status": "stopped"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "stopped"


class TestDeleteResearchProgram:
    """Test DELETE /api/v1/research/programs/{id}"""
    
    def test_delete_program_returns_200(self, client, store):
        """Delete should return 200 OK on success"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.delete(f"/api/v1/research/programs/{created.id}")
        
        assert response.status_code == 200
    
    def test_delete_program_removes_it(self, client, store):
        """Delete should remove program from database"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        prog_id = created.id
        
        # Verify it exists
        response = client.get(f"/api/v1/research/programs/{prog_id}")
        assert response.status_code == 200
        
        # Delete
        client.delete(f"/api/v1/research/programs/{prog_id}")
        
        # Verify it's gone
        response = client.get(f"/api/v1/research/programs/{prog_id}")
        assert response.status_code == 404
    
    def test_delete_not_found_returns_404(self, client):
        """Delete should return 404 if program not found"""
        response = client.delete("/api/v1/research/programs/non-existent-id")
        
        assert response.status_code == 404


class TestStartExperimentLoop:
    """Test POST /api/v1/research/programs/{id}/start"""
    
    def test_start_returns_200(self, client, store):
        """Start should return 200 OK"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.post(f"/api/v1/research/programs/{created.id}/start")
        
        assert response.status_code == 200
    
    def test_start_changes_status_to_running(self, client, store):
        """Start should change status to running"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.post(f"/api/v1/research/programs/{created.id}/start")
        
        data = response.json()
        assert data["status"] == "running"
    
    def test_start_not_found_returns_404(self, client):
        """Start should return 404 if program not found"""
        response = client.post("/api/v1/research/programs/non-existent-id/start")
        
        assert response.status_code == 404


class TestStopExperimentLoop:
    """Test POST /api/v1/research/programs/{id}/stop"""
    
    def test_stop_returns_200(self, client, store):
        """Stop should return 200 OK"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        store.update(created.id, status="running")
        
        response = client.post(f"/api/v1/research/programs/{created.id}/stop")
        
        assert response.status_code == 200
    
    def test_stop_changes_status_to_stopped(self, client, store):
        """Stop should change status to stopped"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        store.update(created.id, status="running")
        
        response = client.post(f"/api/v1/research/programs/{created.id}/stop")
        
        data = response.json()
        assert data["status"] == "stopped"
    
    def test_stop_not_found_returns_404(self, client):
        """Stop should return 404 if program not found"""
        response = client.post("/api/v1/research/programs/non-existent-id/stop")
        
        assert response.status_code == 404


class TestGetExperimentLoopStatus:
    """Test GET /api/v1/research/programs/{id}/status"""
    
    def test_status_returns_200(self, client, store):
        """Status should return 200 OK"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.get(f"/api/v1/research/programs/{created.id}/status")
        
        assert response.status_code == 200
    
    def test_status_returns_status_field(self, client, store):
        """Status should return current program status"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        store.update(created.id, status="running")
        
        response = client.get(f"/api/v1/research/programs/{created.id}/status")
        
        data = response.json()
        assert "status" in data
        assert data["status"] == "running"
    
    def test_status_not_found_returns_404(self, client):
        """Status should return 404 if program not found"""
        response = client.get("/api/v1/research/programs/non-existent-id/status")
        
        assert response.status_code == 404


class TestPresetsEndpoint:
    """Test GET /api/v1/research/programs/presets"""
    
    def test_presets_returns_200(self, client):
        """Presets should return 200 OK"""
        response = client.get("/api/v1/research/programs/presets")
        
        assert response.status_code == 200
    
    def test_presets_returns_default_programs(self, client):
        """Presets should return DEFAULT_PROGRAMS"""
        response = client.get("/api/v1/research/programs/presets")
        
        data = response.json()
        assert isinstance(data, dict)
        assert "quick-explore" in data
        assert "overnight-run" in data
    
    def test_presets_contains_program_details(self, client):
        """Presets should contain full program details"""
        response = client.get("/api/v1/research/programs/presets")
        
        data = response.json()
        quick_explore = data["quick-explore"]
        
        assert quick_explore["run_tag"] == "quick-explore"
        assert "goal" in quick_explore
        assert "search_dimensions" in quick_explore


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_update_with_empty_body(self, client, store):
        """Update with empty body should be allowed (no-op or fail gracefully)"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.patch(
            f"/api/v1/research/programs/{created.id}",
            json={}
        )
        
        # Should be 200 (no changes) or 400 (validation error)
        assert response.status_code in [200, 400]
    
    def test_malformed_json(self, client, store):
        """Malformed JSON should return 422"""
        program = DEFAULT_PROGRAMS["quick-explore"]
        created = store.create(program)
        
        response = client.patch(
            f"/api/v1/research/programs/{created.id}",
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422
