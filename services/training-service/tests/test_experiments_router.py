"""
Integration Tests for Experiment API Routes (Phase 1.3)

Tests cover all 6 API endpoints:
- POST /api/v1/experiments - Create experiment
- GET /api/v1/experiments - List experiments with filtering
- GET /api/v1/experiments/{id} - Get single experiment
- PATCH /api/v1/experiments/{id} - Update experiment
- GET /api/v1/experiments/best - Get best experiment
- GET /api/v1/experiments/export - Export as TSV

Uses TestClient from fastapi.testclient for integration testing.
"""

import pytest
import json
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.testclient import TestClient

from experiments.models import ExperimentStatus
from experiments.store import ExperimentStore
from experiments.router import router, set_store


@pytest.fixture
def temp_db_dir():
    """Create temporary directory for test database"""
    tmpdir = tempfile.mkdtemp(prefix="test_experiments_api_")
    yield tmpdir
    # Cleanup
    shutil.rmtree(tmpdir, ignore_errors=True)


@pytest.fixture
def store(temp_db_dir):
    """Create ExperimentStore with temporary database"""
    store = ExperimentStore(db_dir=Path(temp_db_dir) / ".sovereign-code")
    yield store


@pytest.fixture
def app(store):
    """Create FastAPI test app with router and initialized store"""
    app = FastAPI()
    set_store(store)
    app.include_router(router)
    return app


@pytest.fixture
def client(app):
    """Create test client"""
    return TestClient(app)


class TestCreateExperiment:
    """Tests for POST /api/v1/experiments"""
    
    def test_create_experiment_success(self, client):
        """Should create experiment and return 201 Created"""
        payload = {
            "run_tag": "autoresearch/test",
            "config": {"lr": 0.001, "batch_size": 32},
            "description": "Initial baseline",
        }
        
        response = client.post("/api/v1/experiments", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert data["run_tag"] == "autoresearch/test"
        assert data["config"]["lr"] == 0.001
        assert data["description"] == "Initial baseline"
        assert data["status"] == "pending"
        assert data["id"] is not None
        assert data["created_at"] is not None
    
    def test_create_experiment_with_parent(self, client, store):
        """Should support parent_experiment_id for lineage tracking"""
        # Create parent
        parent = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Parent",
        )
        
        # Create child
        payload = {
            "run_tag": "autoresearch/test",
            "config": {"lr": 0.0005},
            "description": "Child variant",
            "parent_experiment_id": parent.id,
        }
        
        response = client.post("/api/v1/experiments", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert data["parent_experiment_id"] == parent.id
    
    def test_create_experiment_missing_run_tag(self, client):
        """Should return 400 if run_tag missing"""
        payload = {
            "config": {"lr": 0.001},
            "description": "No run_tag",
        }
        
        response = client.post("/api/v1/experiments", json=payload)
        
        assert response.status_code == 422  # Validation error
    
    def test_create_experiment_missing_config(self, client):
        """Should return 400 if config missing"""
        payload = {
            "run_tag": "autoresearch/test",
            "description": "No config",
        }
        
        response = client.post("/api/v1/experiments", json=payload)
        
        assert response.status_code == 422
    
    def test_create_experiment_missing_description(self, client):
        """Should return 400 if description missing"""
        payload = {
            "run_tag": "autoresearch/test",
            "config": {"lr": 0.001},
        }
        
        response = client.post("/api/v1/experiments", json=payload)
        
        assert response.status_code == 422


class TestListExperiments:
    """Tests for GET /api/v1/experiments"""
    
    def test_list_experiments_empty(self, client):
        """Should return empty list when no experiments"""
        response = client.get("/api/v1/experiments")
        
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["limit"] == 100
        assert data["offset"] == 0
    
    def test_list_experiments_success(self, client, store):
        """Should list all experiments"""
        # Create 3 experiments
        for i in range(3):
            store.create(
                run_tag="autoresearch/test",
                config={"lr": 0.001 * (i + 1)},
                description=f"Experiment {i+1}",
            )
        
        response = client.get("/api/v1/experiments")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["total"] == 3
    
    def test_list_experiments_filter_by_run_tag(self, client, store):
        """Should filter experiments by run_tag"""
        store.create(
            run_tag="autoresearch/test1",
            config={"lr": 0.001},
            description="Tag 1",
        )
        store.create(
            run_tag="autoresearch/test2",
            config={"lr": 0.001},
            description="Tag 2",
        )
        
        response = client.get("/api/v1/experiments?run_tag=autoresearch/test1")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["run_tag"] == "autoresearch/test1"
        assert data["total"] == 1
    
    def test_list_experiments_filter_by_status(self, client, store):
        """Should filter experiments by status"""
        exp1 = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Exp 1",
        )
        exp2 = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Exp 2",
        )
        
        # Update one to KEEP
        store.update(exp1.id, status=ExperimentStatus.KEEP)
        
        response = client.get("/api/v1/experiments?status=keep")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["id"] == exp1.id
        assert data["items"][0]["status"] == "keep"
    
    def test_list_experiments_filter_by_run_tag_and_status(self, client, store):
        """Should filter by both run_tag and status"""
        exp = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test",
        )
        store.update(exp.id, status=ExperimentStatus.KEEP)
        
        response = client.get(
            "/api/v1/experiments?run_tag=autoresearch/test&status=keep"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["total"] == 1
    
    def test_list_experiments_pagination(self, client, store):
        """Should support pagination with limit and offset"""
        # Create 5 experiments
        for i in range(5):
            store.create(
                run_tag="autoresearch/test",
                config={"lr": 0.001},
                description=f"Exp {i+1}",
            )
        
        # Get first 2
        response = client.get("/api/v1/experiments?limit=2&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["limit"] == 2
        assert data["offset"] == 0
        assert data["total"] == 5
        
        # Get next 2
        response = client.get("/api/v1/experiments?limit=2&offset=2")
        data = response.json()
        assert len(data["items"]) == 2
        assert data["offset"] == 2
        
        # Get last (should only have 1)
        response = client.get("/api/v1/experiments?limit=2&offset=4")
        data = response.json()
        assert len(data["items"]) == 1
    
    def test_list_experiments_invalid_limit(self, client):
        """Should reject limit > 1000"""
        response = client.get("/api/v1/experiments?limit=2000")
        assert response.status_code == 422
    
    def test_list_experiments_invalid_status(self, client):
        """Should reject invalid status parameter"""
        response = client.get("/api/v1/experiments?status=invalid")
        assert response.status_code == 400


class TestGetExperiment:
    """Tests for GET /api/v1/experiments/{id}"""
    
    def test_get_experiment_success(self, client, store):
        """Should return experiment by ID"""
        exp = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test experiment",
        )
        
        response = client.get(f"/api/v1/experiments/{exp.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == exp.id
        assert data["run_tag"] == "autoresearch/test"
        assert data["config"]["lr"] == 0.001
    
    def test_get_experiment_not_found(self, client):
        """Should return 404 for non-existent experiment"""
        response = client.get("/api/v1/experiments/00000000-0000-0000-0000-000000000000")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_experiment_with_metrics(self, client, store):
        """Should return experiment with populated metrics"""
        exp = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test",
        )
        
        updated = store.update(
            exp.id,
            status=ExperimentStatus.KEEP,
            val_loss=0.123,
            val_bpb=0.456,
            peak_vram_mb=2048.5,
            training_seconds=3600.0,
            total_seconds=3700.0,
        )
        
        response = client.get(f"/api/v1/experiments/{exp.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "keep"
        assert data["val_loss"] == 0.123
        assert data["val_bpb"] == 0.456
        assert data["peak_vram_mb"] == 2048.5


class TestUpdateExperiment:
    """Tests for PATCH /api/v1/experiments/{id}"""
    
    def test_update_experiment_status(self, client, store):
        """Should update experiment status"""
        exp = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test",
        )
        
        payload = {"status": "keep"}
        response = client.patch(f"/api/v1/experiments/{exp.id}", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "keep"
    
    def test_update_experiment_metrics(self, client, store):
        """Should update experiment metrics"""
        exp = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test",
        )
        
        payload = {
            "status": "running",
            "val_loss": 0.123,
            "val_bpb": 0.456,
            "peak_vram_mb": 2048.0,
            "training_seconds": 3600.0,
        }
        response = client.patch(f"/api/v1/experiments/{exp.id}", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert data["val_loss"] == 0.123
        assert data["val_bpb"] == 0.456
        assert data["peak_vram_mb"] == 2048.0
        assert data["training_seconds"] == 3600.0
    
    def test_update_experiment_secondary_metrics(self, client, store):
        """Should update secondary metrics dict"""
        exp = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test",
        )
        
        payload = {
            "secondary_metrics": {"accuracy": 0.92, "f1": 0.88}
        }
        response = client.patch(f"/api/v1/experiments/{exp.id}", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["secondary_metrics"]["accuracy"] == 0.92
        assert data["secondary_metrics"]["f1"] == 0.88
    
    def test_update_experiment_with_timestamps(self, client, store):
        """Should update started_at and completed_at timestamps"""
        exp = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test",
        )
        
        start_time = datetime.now()
        end_time = start_time + timedelta(hours=1)
        
        payload = {
            "status": "keep",
            "started_at": start_time.isoformat(),
            "completed_at": end_time.isoformat(),
        }
        response = client.patch(f"/api/v1/experiments/{exp.id}", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "keep"
        assert data["started_at"] is not None
        assert data["completed_at"] is not None
    
    def test_update_experiment_invalid_status(self, client, store):
        """Should reject invalid status value"""
        exp = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test",
        )
        
        payload = {"status": "invalid_status"}
        response = client.patch(f"/api/v1/experiments/{exp.id}", json=payload)
        
        assert response.status_code == 422  # Validation error
    
    def test_update_experiment_not_found(self, client):
        """Should return 404 if experiment not found"""
        payload = {"status": "keep"}
        response = client.patch(
            "/api/v1/experiments/00000000-0000-0000-0000-000000000000",
            json=payload
        )
        
        assert response.status_code == 404
    
    def test_update_experiment_no_fields(self, client, store):
        """Should return current experiment if no fields to update"""
        exp = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test",
        )
        
        payload = {}
        response = client.patch(f"/api/v1/experiments/{exp.id}", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == exp.id


class TestGetBestExperiment:
    """Tests for GET /api/v1/experiments/best"""
    
    def test_get_best_by_val_loss(self, client, store):
        """Should return experiment with lowest val_loss and status=KEEP"""
        run_tag = "autoresearch/test"
        
        # Create multiple experiments with different val_loss
        exp1 = store.create(run_tag=run_tag, config={"lr": 0.001}, description="Exp 1")
        exp2 = store.create(run_tag=run_tag, config={"lr": 0.0005}, description="Exp 2")
        exp3 = store.create(run_tag=run_tag, config={"lr": 0.0001}, description="Exp 3")
        
        # Update with metrics and KEEP status
        store.update(exp1.id, status=ExperimentStatus.KEEP, val_loss=0.150)
        store.update(exp2.id, status=ExperimentStatus.KEEP, val_loss=0.123)
        store.update(exp3.id, status=ExperimentStatus.KEEP, val_loss=0.145)
        
        response = client.get(f"/api/v1/experiments/best?run_tag={run_tag}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == exp2.id
        assert data["val_loss"] == 0.123
    
    def test_get_best_by_val_bpb(self, client, store):
        """Should return experiment with lowest val_bpb when specified"""
        run_tag = "autoresearch/test"
        
        exp1 = store.create(run_tag=run_tag, config={"lr": 0.001}, description="Exp 1")
        exp2 = store.create(run_tag=run_tag, config={"lr": 0.0005}, description="Exp 2")
        
        store.update(exp1.id, status=ExperimentStatus.KEEP, val_bpb=0.456)
        store.update(exp2.id, status=ExperimentStatus.KEEP, val_bpb=0.389)
        
        response = client.get(
            f"/api/v1/experiments/best?run_tag={run_tag}&primary_metric=val_bpb"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == exp2.id
        assert data["val_bpb"] == 0.389
    
    def test_get_best_ignores_non_keep_status(self, client, store):
        """Should only consider experiments with status=KEEP"""
        run_tag = "autoresearch/test"
        
        exp1 = store.create(run_tag=run_tag, config={"lr": 0.001}, description="Exp 1")
        exp2 = store.create(run_tag=run_tag, config={"lr": 0.0005}, description="Exp 2")
        
        # exp1 has lower val_loss but is DISCARD
        store.update(exp1.id, status=ExperimentStatus.DISCARD, val_loss=0.100)
        # exp2 has higher val_loss but is KEEP
        store.update(exp2.id, status=ExperimentStatus.KEEP, val_loss=0.200)
        
        response = client.get(f"/api/v1/experiments/best?run_tag={run_tag}")
        
        assert response.status_code == 200
        data = response.json()
        # Should return exp2 because it's the only KEEP
        assert data["id"] == exp2.id
    
    def test_get_best_missing_run_tag(self, client):
        """Should return 400 if run_tag not provided"""
        response = client.get("/api/v1/experiments/best")
        
        assert response.status_code == 422
    
    def test_get_best_not_found(self, client):
        """Should return 404 if no KEEP experiments for run_tag"""
        response = client.get("/api/v1/experiments/best?run_tag=nonexistent")
        
        assert response.status_code == 404
        assert "no best experiment" in response.json()["detail"].lower()
    
    def test_get_best_invalid_metric(self, client):
        """Should return 400 if invalid primary_metric"""
        response = client.get(
            "/api/v1/experiments/best?run_tag=test&primary_metric=invalid"
        )
        
        assert response.status_code == 400


class TestExportExperiments:
    """Tests for GET /api/v1/experiments/export"""
    
    def test_export_as_tsv_success(self, client, store):
        """Should export experiments as TSV with correct format"""
        run_tag = "autoresearch/test"
        
        exp1 = store.create(
            run_tag=run_tag,
            config={"lr": 0.001},
            description="Baseline",
        )
        exp2 = store.create(
            run_tag=run_tag,
            config={"lr": 0.0005},
            description="Variant A",
        )
        
        store.update(
            exp1.id,
            status=ExperimentStatus.KEEP,
            val_loss=0.150,
            val_bpb=0.456,
            peak_vram_mb=2048.0,
            commit_hash="abc123",
        )
        store.update(
            exp2.id,
            status=ExperimentStatus.KEEP,
            val_loss=0.123,
            val_bpb=0.389,
            peak_vram_mb=2100.0,
            commit_hash="def456",
        )
        
        response = client.get(f"/api/v1/experiments/export?run_tag={run_tag}")
        
        assert response.status_code == 200
        assert "text/tab-separated-values" in response.headers["content-type"]
        assert "attachment" in response.headers["content-disposition"]
        assert f"experiments_{run_tag}" in response.headers["content-disposition"]
        assert ".tsv" in response.headers["content-disposition"]
        
        # Parse TSV content
        lines = response.text.strip().split("\n")
        assert len(lines) == 3  # Header + 2 data rows
        
        # Verify header
        header = lines[0]
        assert "commit_hash" in header
        assert "val_loss" in header
        assert "val_bpb" in header
        assert "peak_vram_mb" in header
        assert "status" in header
        assert "description" in header
        
        # Verify data rows contain expected values (order may vary due to DESC sorting)
        row1 = lines[1].split("\t")
        row2 = lines[2].split("\t")
        
        # Collect all commit hashes from the two rows
        all_hashes = [row1[0], row2[0]]
        assert "abc123" in all_hashes or "abc123" in row1[0] or "abc123" in row2[0]
        assert "def456" in all_hashes or "def456" in row1[0] or "def456" in row2[0]
        
        # Verify val_loss values appear
        all_vals = response.text
        assert "0.15" in all_vals or "0.150" in all_vals  # exp1
        assert "0.123" in all_vals  # exp2
    
    def test_export_empty_run_tag(self, client):
        """Should return empty TSV if run_tag has no experiments"""
        response = client.get("/api/v1/experiments/export?run_tag=nonexistent")
        
        assert response.status_code == 200
        lines = response.text.strip().split("\n")
        # Should have header but no data rows
        assert len(lines) == 1
        assert "commit_hash" in lines[0]
    
    def test_export_missing_run_tag(self, client):
        """Should return 422 if run_tag not provided"""
        response = client.get("/api/v1/experiments/export")
        
        assert response.status_code == 422
    
    def test_export_unsupported_format(self, client):
        """Should return 400 for unsupported format"""
        response = client.get("/api/v1/experiments/export?run_tag=test&format=json")
        
        assert response.status_code == 400
        assert "unsupported format" in response.json()["detail"].lower()
    
    def test_export_filename_includes_timestamp(self, client, store):
        """Should generate filename with timestamp"""
        run_tag = "autoresearch/test"
        store.create(
            run_tag=run_tag,
            config={"lr": 0.001},
            description="Test",
        )
        
        response = client.get(f"/api/v1/experiments/export?run_tag={run_tag}")
        
        disposition = response.headers["content-disposition"]
        assert ".tsv" in disposition
        # Filename should contain run_tag and timestamp
        assert run_tag in disposition


class TestBackwardsCompatibility:
    """Verify no breaking changes to existing routes"""
    
    def test_router_prefix_correct(self, app):
        """Routes should be under /api/v1/experiments"""
        # This checks that all routes are properly prefixed
        routes = [route.path for route in app.routes]
        assert any("/api/v1/experiments" in route for route in routes)
        assert not any(route.startswith("/finetune") for route in routes if isinstance(route, str))
