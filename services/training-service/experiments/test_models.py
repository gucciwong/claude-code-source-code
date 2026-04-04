"""
Tests for Experiment data model (Phase 1.1)
Tests creation, validation, status enum, and serialization
"""

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError
from experiments.models import ExperimentStatus, Experiment


class TestExperimentStatus:
    """Test ExperimentStatus enum"""

    def test_status_values(self):
        """Verify all required status values exist"""
        assert ExperimentStatus.PENDING.value == "pending"
        assert ExperimentStatus.RUNNING.value == "running"
        assert ExperimentStatus.KEEP.value == "keep"
        assert ExperimentStatus.DISCARD.value == "discard"
        assert ExperimentStatus.CRASH.value == "crash"

    def test_status_is_string_enum(self):
        """Verify status can be compared as string"""
        status = ExperimentStatus.KEEP
        assert status == "keep"
        assert str(status.value) == "keep"


class TestExperimentCreation:
    """Test Experiment model instantiation"""

    def test_minimal_experiment_creation(self):
        """Create experiment with required fields only"""
        now = datetime.now(timezone.utc)
        exp = Experiment(
            id="exp-001",
            run_tag="autoresearch/jun15",
            config={"lr": 3e-4, "batch_size": 4},
            description="Testing baseline config",
            status=ExperimentStatus.PENDING,
            created_at=now,
        )
        
        assert exp.id == "exp-001"
        assert exp.run_tag == "autoresearch/jun15"
        assert exp.config == {"lr": 3e-4, "batch_size": 4}
        assert exp.description == "Testing baseline config"
        assert exp.status == ExperimentStatus.PENDING
        assert exp.created_at == now

    def test_full_experiment_creation(self):
        """Create experiment with all fields"""
        now = datetime.now(timezone.utc)
        start = datetime.now(timezone.utc)
        end = datetime.now(timezone.utc)
        
        exp = Experiment(
            id="exp-002",
            run_tag="autoresearch/jun15",
            commit_hash="abc123def",
            config={"lr": 5e-4, "batch_size": 8},
            description="Increased learning rate and batch size",
            status=ExperimentStatus.COMPLETED if hasattr(ExperimentStatus, 'COMPLETED') else ExperimentStatus.KEEP,
            val_loss=0.45,
            val_bpb=1.2,
            primary_metric=0.45,
            secondary_metrics={"accuracy": 0.92, "f1": 0.88},
            peak_vram_mb=8192.5,
            training_seconds=3600.0,
            total_seconds=3700.0,
            created_at=now,
            started_at=start,
            completed_at=end,
            parent_experiment_id="exp-001",
            changes_from_parent="Doubled learning rate and batch size",
        )
        
        assert exp.id == "exp-002"
        assert exp.commit_hash == "abc123def"
        assert exp.val_loss == 0.45
        assert exp.val_bpb == 1.2
        assert exp.primary_metric == 0.45
        assert exp.secondary_metrics == {"accuracy": 0.92, "f1": 0.88}
        assert exp.peak_vram_mb == 8192.5
        assert exp.training_seconds == 3600.0
        assert exp.total_seconds == 3700.0
        assert exp.parent_experiment_id == "exp-001"
        assert exp.changes_from_parent == "Doubled learning rate and batch size"

    def test_optional_fields_default_to_none(self):
        """Verify optional fields default to None when not provided"""
        now = datetime.now(timezone.utc)
        exp = Experiment(
            id="exp-003",
            run_tag="autoresearch/jun15",
            config={},
            description="Minimal test",
            status=ExperimentStatus.PENDING,
            created_at=now,
        )
        
        assert exp.commit_hash is None
        assert exp.val_loss is None
        assert exp.val_bpb is None
        assert exp.primary_metric is None
        assert exp.secondary_metrics is not None  # Should be empty dict
        assert exp.peak_vram_mb is None
        assert exp.training_seconds is None
        assert exp.total_seconds is None
        assert exp.started_at is None
        assert exp.completed_at is None
        assert exp.parent_experiment_id is None

    def test_secondary_metrics_default_empty_dict(self):
        """Verify secondary_metrics defaults to empty dict"""
        now = datetime.now(timezone.utc)
        exp = Experiment(
            id="exp-004",
            run_tag="test",
            config={},
            description="Test defaults",
            status=ExperimentStatus.PENDING,
            created_at=now,
        )
        
        assert isinstance(exp.secondary_metrics, dict)
        assert len(exp.secondary_metrics) == 0


class TestExperimentValidation:
    """Test Experiment model validation"""

    def test_required_fields_validation(self):
        """Verify required fields are enforced"""
        with pytest.raises(ValidationError):
            # Missing id
            Experiment(
                run_tag="test",
                config={},
                description="Missing id",
                status=ExperimentStatus.PENDING,
                created_at=datetime.now(timezone.utc),
            )

    def test_invalid_status_type(self):
        """Verify status must be valid ExperimentStatus"""
        with pytest.raises(ValidationError):
            Experiment(
                id="exp-005",
                run_tag="test",
                config={},
                description="Invalid status",
                status="invalid_status",  # type: ignore
                created_at=datetime.now(timezone.utc),
            )

    def test_config_must_be_dict(self):
        """Verify config field is a dict"""
        with pytest.raises(ValidationError):
            Experiment(
                id="exp-006",
                run_tag="test",
                config="not_a_dict",  # type: ignore
                description="Wrong type",
                status=ExperimentStatus.PENDING,
                created_at=datetime.now(timezone.utc),
            )

    def test_metrics_must_be_numeric(self):
        """Verify metric fields accept numeric values (int, float)"""
        now = datetime.now(timezone.utc)
        
        # Float values should work
        exp = Experiment(
            id="exp-007",
            run_tag="test",
            config={},
            description="Float metrics",
            status=ExperimentStatus.KEEP,
            val_loss=0.5,
            primary_metric=0.95,
            created_at=now,
        )
        assert exp.val_loss == 0.5
        assert exp.primary_metric == 0.95
        
        # Integer values should also work (coerced to float)
        exp2 = Experiment(
            id="exp-008",
            run_tag="test",
            config={},
            description="Int metrics",
            status=ExperimentStatus.KEEP,
            val_loss=1,
            primary_metric=2,
            created_at=now,
        )
        assert exp2.val_loss == 1
        assert exp2.primary_metric == 2


class TestExperimentSerialization:
    """Test Experiment serialization"""

    def test_to_dict(self):
        """Verify model_dump produces valid dictionary"""
        now = datetime.now(timezone.utc)
        exp = Experiment(
            id="exp-009",
            run_tag="autoresearch/test",
            config={"lr": 1e-4},
            description="Serialization test",
            status=ExperimentStatus.KEEP,
            val_loss=0.3,
            created_at=now,
        )
        
        data = exp.model_dump()
        assert isinstance(data, dict)
        assert data["id"] == "exp-009"
        assert data["run_tag"] == "autoresearch/test"
        assert data["status"] == "keep"  # Enum serializes to value
        assert data["val_loss"] == 0.3

    def test_to_json(self):
        """Verify model_dump_json produces valid JSON string"""
        now = datetime.now(timezone.utc)
        exp = Experiment(
            id="exp-010",
            run_tag="autoresearch/test",
            config={"lr": 1e-4},
            description="JSON serialization test",
            status=ExperimentStatus.DISCARD,
            created_at=now,
        )
        
        json_str = exp.model_dump_json()
        assert isinstance(json_str, str)
        assert "exp-010" in json_str
        assert "autoresearch/test" in json_str
        assert "discard" in json_str

    def test_from_dict(self):
        """Verify model_validate reconstructs from dict"""
        now = datetime.now(timezone.utc)
        original = Experiment(
            id="exp-011",
            run_tag="test_run",
            config={"param": "value"},
            description="Validation test",
            status=ExperimentStatus.RUNNING,
            val_loss=0.42,
            created_at=now,
        )
        
        data = original.model_dump()
        reconstructed = Experiment.model_validate(data)
        
        assert reconstructed.id == original.id
        assert reconstructed.run_tag == original.run_tag
        assert reconstructed.config == original.config
        assert reconstructed.status == original.status
        assert reconstructed.val_loss == original.val_loss


class TestExperimentLineage:
    """Test parent-child experiment relationships"""

    def test_parent_child_relationship(self):
        """Verify parent-child experiment lineage tracking"""
        now = datetime.now(timezone.utc)
        
        parent = Experiment(
            id="exp-parent",
            run_tag="autoresearch/jun15",
            config={"lr": 3e-4},
            description="Parent experiment",
            status=ExperimentStatus.KEEP,
            created_at=now,
        )
        
        child = Experiment(
            id="exp-child",
            run_tag="autoresearch/jun15",
            config={"lr": 5e-4},
            description="Child experiment based on parent",
            status=ExperimentStatus.RUNNING,
            parent_experiment_id=parent.id,
            changes_from_parent="Changed learning rate from 3e-4 to 5e-4",
            created_at=datetime.now(timezone.utc),
        )
        
        assert child.parent_experiment_id == parent.id
        assert "learning rate" in child.changes_from_parent.lower()


class TestExperimentStatus:
    """Additional status tests for decision logic"""

    def test_status_for_keep_discard_crash_decisions(self):
        """Verify status enum supports autoresearch keep/discard/crash classification"""
        keep_exp = Experiment(
            id="keep",
            run_tag="test",
            config={},
            description="Keeping this",
            status=ExperimentStatus.KEEP,
            primary_metric=0.95,
            created_at=datetime.now(timezone.utc),
        )
        
        discard_exp = Experiment(
            id="discard",
            run_tag="test",
            config={},
            description="Discarding this",
            status=ExperimentStatus.DISCARD,
            primary_metric=0.50,
            created_at=datetime.now(timezone.utc),
        )
        
        crash_exp = Experiment(
            id="crash",
            run_tag="test",
            config={},
            description="This one crashed",
            status=ExperimentStatus.CRASH,
            created_at=datetime.now(timezone.utc),
        )
        
        assert keep_exp.status == ExperimentStatus.KEEP
        assert discard_exp.status == ExperimentStatus.DISCARD
        assert crash_exp.status == ExperimentStatus.CRASH
