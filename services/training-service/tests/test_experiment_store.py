"""
Tests for ExperimentStore (Phase 1.2 - Persistent Experiment Storage)

Tests cover:
- CRUD operations (create, get, list, update)
- Query filtering (run_tag, status)
- Best experiment selection (lowest primary_metric with status=KEEP)
- TSV export format
- Database persistence
- Error handling
- Duplicate prevention
"""

import pytest
import json
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, timedelta
import sqlite3

from experiments.models import Experiment, ExperimentStatus
from experiments.store import ExperimentStore


@pytest.fixture
def temp_db_dir():
    """Create temporary directory for test database"""
    tmpdir = tempfile.mkdtemp(prefix="test_experiments_")
    yield tmpdir
    # Cleanup
    shutil.rmtree(tmpdir, ignore_errors=True)


@pytest.fixture
def store(temp_db_dir, monkeypatch):
    """Create ExperimentStore with temporary database"""
    # Monkeypatch the home directory to use our temp directory
    monkeypatch.setenv('HOME', temp_db_dir)
    monkeypatch.setenv('USERPROFILE', temp_db_dir)  # Windows
    
    store = ExperimentStore(db_dir=Path(temp_db_dir) / ".sovereign-code")
    yield store
    

class TestExperimentStoreBasics:
    """Test basic CRUD operations"""
    
    def test_store_initializes_database_on_first_use(self, temp_db_dir):
        """Database and schema should auto-initialize on first use"""
        db_path = Path(temp_db_dir) / ".sovereign-code" / "experiments.db"
        assert not db_path.exists()
        
        store = ExperimentStore(db_dir=Path(temp_db_dir) / ".sovereign-code")
        
        assert db_path.exists()
        # Verify schema
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='experiments'")
        assert cursor.fetchone() is not None
        conn.close()
    
    def test_create_experiment(self, store):
        """Should create and return experiment with UUID and timestamp"""
        config = {"lr": 0.001, "batch_size": 32}
        description = "Initial baseline"
        
        exp = store.create(
            run_tag="autoresearch/test",
            config=config,
            description=description,
            parent_experiment_id=None
        )
        
        assert exp.id is not None
        assert len(exp.id) == 36  # UUID format
        assert exp.run_tag == "autoresearch/test"
        assert exp.config == config
        assert exp.description == description
        assert exp.status == ExperimentStatus.PENDING
        assert exp.created_at is not None
        assert isinstance(exp.created_at, datetime)
    
    def test_get_experiment(self, store):
        """Should retrieve created experiment by ID"""
        exp1 = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Baseline"
        )
        
        exp2 = store.get(exp1.id)
        
        assert exp2 is not None
        assert exp2.id == exp1.id
        assert exp2.config == {"lr": 0.001}
        assert exp2.description == "Baseline"
    
    def test_get_nonexistent_experiment(self, store):
        """Should return None for nonexistent experiment ID"""
        exp = store.get("nonexistent-id")
        assert exp is None


class TestExperimentStoreUpdate:
    """Test update operations"""
    
    def test_update_experiment_status(self, store):
        """Should update experiment status"""
        exp1 = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test"
        )
        
        exp2 = store.update(exp1.id, status=ExperimentStatus.RUNNING)
        
        assert exp2.status == ExperimentStatus.RUNNING
        # Verify persistence
        exp3 = store.get(exp1.id)
        assert exp3.status == ExperimentStatus.RUNNING
    
    def test_update_experiment_metrics(self, store):
        """Should update validation metrics"""
        exp1 = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test"
        )
        
        exp2 = store.update(
            exp1.id,
            val_loss=2.5,
            val_bpb=1.8,
            primary_metric=2.5,
            secondary_metrics={"accuracy": 0.92},
            peak_vram_mb=5400
        )
        
        assert exp2.val_loss == 2.5
        assert exp2.val_bpb == 1.8
        assert exp2.primary_metric == 2.5
        assert exp2.secondary_metrics == {"accuracy": 0.92}
        assert exp2.peak_vram_mb == 5400
    
    def test_update_experiment_timestamps(self, store):
        """Should update started_at and completed_at"""
        exp1 = store.create(
            run_tag="autoresearch/test",
            config={"lr": 0.001},
            description="Test"
        )
        
        started = datetime.now()
        completed = datetime.now() + timedelta(seconds=60)
        
        exp2 = store.update(
            exp1.id,
            started_at=started,
            completed_at=completed,
            training_seconds=60.0,
            total_seconds=65.0
        )
        
        assert exp2.started_at is not None
        assert exp2.completed_at is not None
        assert exp2.training_seconds == 60.0
        assert exp2.total_seconds == 65.0
    
    def test_update_nonexistent_experiment_raises_error(self, store):
        """Should raise error when updating nonexistent experiment"""
        with pytest.raises(ValueError):
            store.update("nonexistent-id", status=ExperimentStatus.KEEP)


class TestExperimentStoreQuery:
    """Test querying and filtering"""
    
    def test_list_all_experiments(self, store):
        """Should list all experiments"""
        exp1 = store.create("run1", {"lr": 0.001}, "Exp1")
        exp2 = store.create("run1", {"lr": 0.002}, "Exp2")
        exp3 = store.create("run2", {"lr": 0.001}, "Exp3")
        
        exps = store.list()
        
        assert len(exps) == 3
        # Should be sorted by created_at descending (most recent first)
        assert exps[0].id == exp3.id
        assert exps[1].id == exp2.id
        assert exps[2].id == exp1.id
    
    def test_list_by_run_tag(self, store):
        """Should filter experiments by run_tag"""
        store.create("autoresearch/jun15", {"lr": 0.001}, "Exp1")
        store.create("autoresearch/jun15", {"lr": 0.002}, "Exp2")
        store.create("autoresearch/jun16", {"lr": 0.001}, "Exp3")
        
        exps = store.list(run_tag="autoresearch/jun15")
        
        assert len(exps) == 2
        assert all(e.run_tag == "autoresearch/jun15" for e in exps)
    
    def test_list_by_status(self, store):
        """Should filter experiments by status"""
        exp1 = store.create("run1", {"lr": 0.001}, "Exp1")
        exp2 = store.create("run1", {"lr": 0.002}, "Exp2")
        exp3 = store.create("run1", {"lr": 0.003}, "Exp3")
        
        store.update(exp1.id, status=ExperimentStatus.KEEP)
        store.update(exp2.id, status=ExperimentStatus.DISCARD)
        # exp3 stays PENDING
        
        keep_exps = store.list(status=ExperimentStatus.KEEP)
        assert len(keep_exps) == 1
        assert keep_exps[0].id == exp1.id
        
        discard_exps = store.list(status=ExperimentStatus.DISCARD)
        assert len(discard_exps) == 1
        assert discard_exps[0].id == exp2.id
    
    def test_list_with_limit_and_offset(self, store):
        """Should apply limit and offset"""
        for i in range(10):
            store.create("run1", {"lr": 0.001 + i * 0.001}, f"Exp{i}")
        
        # First page
        page1 = store.list(limit=3)
        assert len(page1) == 3
        
        # Second page
        page2 = store.list(limit=3, offset=3)
        assert len(page2) == 3
        
        # Different experiments on each page
        page1_ids = {e.id for e in page1}
        page2_ids = {e.id for e in page2}
        assert len(page1_ids & page2_ids) == 0
    
    def test_list_combined_filters(self, store):
        """Should apply run_tag, status, limit together"""
        # Create multiple experiments
        for tag in ["run1", "run2"]:
            for i in range(5):
                exp = store.create(tag, {"lr": 0.001}, f"Exp{i}")
                if i % 2 == 0:
                    store.update(exp.id, status=ExperimentStatus.KEEP)
        
        exps = store.list(run_tag="run1", status=ExperimentStatus.KEEP, limit=2)
        
        assert len(exps) <= 2
        assert all(e.run_tag == "run1" for e in exps)
        assert all(e.status == ExperimentStatus.KEEP for e in exps)


class TestExperimentStoreBest:
    """Test get_best functionality"""
    
    def test_get_best_experiment_lowest_metric(self, store):
        """Should return experiment with lowest primary_metric and status=KEEP"""
        exp1 = store.create("autoresearch/test", {"lr": 0.001}, "Exp1")
        exp2 = store.create("autoresearch/test", {"lr": 0.002}, "Exp2")
        exp3 = store.create("autoresearch/test", {"lr": 0.003}, "Exp3")
        
        store.update(exp1.id, status=ExperimentStatus.KEEP, primary_metric=2.5)
        store.update(exp2.id, status=ExperimentStatus.KEEP, primary_metric=2.1)  # Best
        store.update(exp3.id, status=ExperimentStatus.DISCARD, primary_metric=2.0)  # Not KEEP
        
        best = store.get_best("autoresearch/test", primary_metric="primary_metric")
        
        assert best is not None
        assert best.id == exp2.id
        assert best.primary_metric == 2.1
    
    def test_get_best_ignores_non_keep_status(self, store):
        """Should only consider experiments with status=KEEP"""
        exp1 = store.create("autoresearch/test", {"lr": 0.001}, "Exp1")
        exp2 = store.create("autoresearch/test", {"lr": 0.002}, "Exp2")
        
        store.update(exp1.id, status=ExperimentStatus.RUNNING, primary_metric=2.0)
        store.update(exp2.id, status=ExperimentStatus.KEEP, primary_metric=2.5)
        
        best = store.get_best("autoresearch/test", primary_metric="primary_metric")
        
        assert best is not None
        assert best.id == exp2.id
    
    def test_get_best_different_run_tags(self, store):
        """Should only consider experiments from specified run_tag"""
        exp1 = store.create("autoresearch/jun15", {"lr": 0.001}, "Exp1")
        exp2 = store.create("autoresearch/jun16", {"lr": 0.002}, "Exp2")
        
        store.update(exp1.id, status=ExperimentStatus.KEEP, primary_metric=2.5)
        store.update(exp2.id, status=ExperimentStatus.KEEP, primary_metric=2.0)  # Lower but different run_tag
        
        best = store.get_best("autoresearch/jun15", primary_metric="primary_metric")
        
        assert best is not None
        assert best.id == exp1.id
    
    def test_get_best_no_keep_experiments(self, store):
        """Should return None if no experiments with status=KEEP"""
        exp1 = store.create("autoresearch/test", {"lr": 0.001}, "Exp1")
        store.update(exp1.id, status=ExperimentStatus.DISCARD)
        
        best = store.get_best("autoresearch/test")
        
        assert best is None
    
    def test_get_best_no_experiments_for_run_tag(self, store):
        """Should return None if run_tag has no experiments"""
        best = store.get_best("autoresearch/nonexistent")
        assert best is None
    
    def test_get_best_custom_primary_metric(self, store):
        """Should support custom primary_metric field name"""
        exp1 = store.create("autoresearch/test", {"lr": 0.001}, "Exp1")
        exp2 = store.create("autoresearch/test", {"lr": 0.002}, "Exp2")
        
        store.update(exp1.id, status=ExperimentStatus.KEEP, val_loss=2.5)
        store.update(exp2.id, status=ExperimentStatus.KEEP, val_loss=2.1)
        
        best = store.get_best("autoresearch/test", primary_metric="val_loss")
        
        assert best is not None
        assert best.id == exp2.id


class TestExperimentStoreExport:
    """Test TSV export functionality"""
    
    def test_export_tsv_format(self, store, temp_db_dir):
        """Should export experiments in correct TSV format"""
        exp1 = store.create("autoresearch/test", {"lr": 0.001}, "Baseline run")
        exp2 = store.create("autoresearch/test", {"lr": 0.002}, "High LR attempted")
        
        store.update(exp1.id, 
                    status=ExperimentStatus.KEEP,
                    commit_hash="abc123",
                    val_loss=2.14,
                    val_bpb=1.55,
                    peak_vram_mb=5400)
        store.update(exp2.id,
                    status=ExperimentStatus.DISCARD,
                    commit_hash="def456",
                    val_loss=2.15,
                    val_bpb=1.56,
                    peak_vram_mb=5300)
        
        output_path = Path(temp_db_dir) / "results.tsv"
        store.export_tsv("autoresearch/test", output_path)
        
        assert output_path.exists()
        
        with open(output_path, 'r') as f:
            lines = f.read().strip().split('\n')
        
        # Check header
        assert lines[0] == "commit_hash\tval_loss\tval_bpb\tpeak_vram_mb\tstatus\tdescription"
        
        # Check data rows (should be sorted by created_at descending)
        data_lines = lines[1:]
        assert len(data_lines) == 2
        
        # Most recent first
        row1 = data_lines[0].split('\t')
        assert row1[0] == "def456"
        assert row1[1] == "2.15"
        assert row1[2] == "1.56"
        assert float(row1[3]) == 5300.0  # Handle float representation
        assert row1[4] == "discard"
        assert "High LR" in row1[5]
        
        row2 = data_lines[1].split('\t')
        assert row2[0] == "abc123"
        assert row2[1] == "2.14"
        assert row2[2] == "1.55"
        assert float(row2[3]) == 5400.0  # Handle float representation
        assert row2[4] == "keep"
        assert "Baseline" in row2[5]
    
    def test_export_tsv_filters_by_run_tag(self, store, temp_db_dir):
        """Should only export experiments from specified run_tag"""
        store.create("autoresearch/jun15", {"lr": 0.001}, "Exp1")
        exp2 = store.create("autoresearch/jun16", {"lr": 0.002}, "Exp2")
        
        exp1 = store.get(list(store.list(run_tag="autoresearch/jun15"))[0].id)
        store.update(exp1.id, status=ExperimentStatus.KEEP, commit_hash="aaa")
        store.update(exp2.id, status=ExperimentStatus.KEEP, commit_hash="bbb")
        
        output_path = Path(temp_db_dir) / "results.tsv"
        store.export_tsv("autoresearch/jun15", output_path)
        
        with open(output_path, 'r') as f:
            lines = f.read().strip().split('\n')
        
        # Header + 1 data row
        assert len(lines) == 2
        assert "aaa" in lines[1]
    
    def test_export_tsv_handles_none_values(self, store, temp_db_dir):
        """Should handle None values in optional fields"""
        exp = store.create("autoresearch/test", {"lr": 0.001}, "Test")
        store.update(exp.id, status=ExperimentStatus.PENDING)
        # Leave metrics as None
        
        output_path = Path(temp_db_dir) / "results.tsv"
        store.export_tsv("autoresearch/test", output_path)
        
        with open(output_path, 'r') as f:
            lines = f.read().strip().split('\n')
        
        # Should still export with None values
        assert len(lines) >= 2
    
    def test_export_tsv_empty_run_tag(self, store, temp_db_dir):
        """Should create empty TSV for run_tag with no experiments"""
        output_path = Path(temp_db_dir) / "results.tsv"
        store.export_tsv("autoresearch/nonexistent", output_path)
        
        assert output_path.exists()
        with open(output_path, 'r') as f:
            lines = f.read().strip().split('\n')
        
        # Just header, no data
        assert len(lines) == 1
        assert "commit_hash" in lines[0]


class TestExperimentStorePersistence:
    """Test database persistence across restarts"""
    
    def test_experiments_persist_across_store_instances(self, temp_db_dir):
        """Data should persist when creating new store instances"""
        store1 = ExperimentStore(db_dir=Path(temp_db_dir) / ".sovereign-code")
        exp1 = store1.create("autoresearch/test", {"lr": 0.001}, "Test")
        initial_id = exp1.id
        
        # Create new store instance (simulates service restart)
        store2 = ExperimentStore(db_dir=Path(temp_db_dir) / ".sovereign-code")
        exp_retrieved = store2.get(initial_id)
        
        assert exp_retrieved is not None
        assert exp_retrieved.id == initial_id
        assert exp_retrieved.config == {"lr": 0.001}
    
    def test_wal_mode_enabled(self, temp_db_dir):
        """Database should use WAL mode for reliability"""
        store = ExperimentStore(db_dir=Path(temp_db_dir) / ".sovereign-code")
        
        db_path = Path(temp_db_dir) / ".sovereign-code" / "experiments.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode")
        mode = cursor.fetchone()[0]
        conn.close()
        
        assert mode.upper() == "WAL"


class TestExperimentStoreErrorHandling:
    """Test error handling and edge cases"""
    
    def test_duplicate_experiment_id_prevention(self, store):
        """Should not allow inserting duplicate experiment IDs"""
        exp1 = store.create("autoresearch/test", {"lr": 0.001}, "Test1")
        
        # Try to create another experiment with same ID (manual insertion attempt)
        # This should be prevented by database constraints
        config = {"lr": 0.002}
        db_path = store.db_path
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO experiments 
                (id, run_tag, config, description, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (exp1.id, "autoresearch/test", json.dumps(config), "Test2", 
                  "pending", datetime.now().isoformat()))
            conn.commit()
            assert False, "Should have raised UNIQUE constraint error"
        except sqlite3.IntegrityError:
            # Expected - duplicate ID prevented
            pass
        finally:
            conn.close()
    
    def test_json_serialization_of_configs(self, store):
        """Should correctly serialize and deserialize complex config dicts"""
        config = {
            "lr": 0.001,
            "batch_size": 32,
            "layers": [128, 256, 512],
            "nested": {"lora_rank": 8, "alpha": 16}
        }
        
        exp1 = store.create("autoresearch/test", config, "Test")
        exp2 = store.get(exp1.id)
        
        assert exp2.config == config
        assert exp2.config["nested"]["lora_rank"] == 8


class TestExperimentStoreParentLineage:
    """Test parent experiment relationships"""
    
    def test_create_with_parent_experiment_id(self, store):
        """Should track parent experiment lineage"""
        exp1 = store.create("autoresearch/test", {"lr": 0.001}, "Baseline")
        exp2 = store.create(
            "autoresearch/test",
            {"lr": 0.002},
            "Higher learning rate",
            parent_experiment_id=exp1.id
        )
        
        assert exp2.parent_experiment_id == exp1.id
    
    def test_changes_from_parent_tracking(self, store):
        """Should track what changed from parent"""
        exp1 = store.create("autoresearch/test", {"lr": 0.001}, "Baseline")
        exp2 = store.create(
            "autoresearch/test",
            {"lr": 0.002},
            "Higher learning rate",
            parent_experiment_id=exp1.id
        )
        
        updated = store.update(exp2.id, changes_from_parent="Increased lr from 0.001 to 0.002")
        assert "lr" in updated.changes_from_parent
