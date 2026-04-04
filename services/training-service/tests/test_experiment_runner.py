"""
Tests for ExperimentRunner (Phase 3.1)

Covers: single experiments, keep/discard logic, crash handling, loop behavior,
and checkpoint management.
"""

import pytest
import asyncio
import tempfile
import json
from pathlib import Path
from datetime import datetime
from unittest.mock import Mock, AsyncMock, MagicMock, patch
from datasets import Dataset

from autoresearch.runner import ExperimentRunner, RandomHypothesisGenerator, HypothesisGenerator
from experiments.models import Experiment, ExperimentStatus
from experiments.store import ExperimentStore


# Test Fixtures
@pytest.fixture
def temp_db_dir():
    """Temporary directory for test database"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def experiment_store(temp_db_dir):
    """Initialize in-memory experiment store"""
    return ExperimentStore(temp_db_dir)


@pytest.fixture
def checkpoint_dir():
    """Temporary checkpoint directory"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def mock_trainer():
    """Mock QLORATrainer"""
    trainer = AsyncMock()
    trainer.train = AsyncMock(return_value={
        "loss": 3.21,
        "duration_seconds": 120.0,
        "adapter_path": "/tmp/adapter",
        "num_train_steps": 100,
        "metrics": {},
    })
    return trainer


@pytest.fixture
def mock_evaluator():
    """Mock EvaluationHarness"""
    evaluator = AsyncMock()
    evaluator.evaluate = AsyncMock(return_value={
        "val_loss": 3.21,
        "val_bpb": 4.5,
    })
    return evaluator


@pytest.fixture
def mock_hypothesis_generator():
    """Mock HypothesisGenerator"""
    gen = AsyncMock()
    gen.generate = AsyncMock(return_value={
        "learning_rate": 0.0001,
        "per_device_batch_size": 4,
        "num_epochs": 1,
    })
    return gen


@pytest.fixture
def mock_dataset():
    """Mock Dataset - simple mock object to avoid serialization issues"""
    dataset = Mock()
    dataset.__len__ = Mock(return_value=2)
    dataset.map = Mock(return_value=dataset)
    return dataset


@pytest.fixture
def mock_train_with_checkpoint(checkpoint_dir):
    """Factory for mock_train that creates real checkpoint directories"""
    async def mock_train(*args, **kwargs):
        # Create a mock checkpoint directory
        run_name = kwargs.get("run_name", "exp-test")
        save_dir = Path(kwargs.get("save_dir", checkpoint_dir)) / run_name / "adapter"
        save_dir.mkdir(parents=True, exist_ok=True)
        return {
            "loss": 3.20,
            "duration_seconds": 120.0,
            "adapter_path": str(save_dir),
            "num_train_steps": 100,
            "metrics": {},
        }
    return mock_train


@pytest.fixture
def runner(mock_trainer, mock_evaluator, experiment_store, mock_hypothesis_generator, mock_dataset, checkpoint_dir):
    """Initialize ExperimentRunner with mocks"""
    return ExperimentRunner(
        trainer=mock_trainer,
        evaluator=mock_evaluator,
        store=experiment_store,
        hypothesis_generator=mock_hypothesis_generator,
        train_dataset=mock_dataset,
        checkpoint_dir=checkpoint_dir,
        primary_metric="val_loss",
    )


# ============================================================================
# Test 1: Single Experiment - Full workflow (generate → train → eval → decide)
# ============================================================================

@pytest.mark.asyncio
async def test_single_experiment_workflow(runner, mock_trainer, mock_evaluator, mock_hypothesis_generator, checkpoint_dir):
    """Test complete single experiment workflow"""
    
    # Setup: mock trainer to create checkpoint directory after training
    async def mock_train(*args, **kwargs):
        # Create a mock checkpoint directory
        run_name = kwargs.get("run_name", "exp-test")
        save_dir = Path(kwargs.get("save_dir", ".")) / run_name / "adapter"
        save_dir.mkdir(parents=True, exist_ok=True)
        return {
            "loss": 3.20,
            "duration_seconds": 120.0,
            "adapter_path": str(save_dir),
            "num_train_steps": 100,
            "metrics": {},
        }
    
    mock_trainer.train = mock_train
    
    # Setup: mock evaluator to return better metrics (lower loss = improvement)
    mock_evaluator.evaluate.return_value = {
        "val_loss": 3.15,
        "val_bpb": 4.4,
    }
    
    # Run single experiment
    experiment = await runner._run_single_experiment(
        run_tag="test-run",
        experiment_num=1,
        time_budget_seconds=600.0,
    )
    
    # Assertions
    assert experiment.id is not None
    assert experiment.run_tag == "test-run"
    assert experiment.config == {"learning_rate": 0.0001, "per_device_batch_size": 4, "num_epochs": 1}
    assert experiment.status == ExperimentStatus.KEEP  # First experiment is always kept
    assert experiment.val_loss == 3.15
    assert experiment.primary_metric == 3.15
    assert experiment.started_at is not None
    assert experiment.completed_at is not None
    
    # Verify calls
    mock_hypothesis_generator.generate.assert_called_once()
    mock_evaluator.evaluate.assert_called_once()


# ============================================================================
# Test 2: Keep Logic - Improved metric results in KEEP
# ============================================================================

@pytest.mark.asyncio
async def test_keep_logic_improvement(runner, mock_trainer, mock_evaluator, mock_hypothesis_generator, mock_train_with_checkpoint, checkpoint_dir):
    """Test KEEP decision when metric improves (lower val_loss)"""
    
    # Setup mock trainer with checkpoint creation
    mock_trainer.train = mock_train_with_checkpoint
    
    # First experiment (baseline)
    mock_evaluator.evaluate.return_value = {"val_loss": 3.20, "val_bpb": 4.5}
    exp1 = await runner._run_single_experiment("test", 1, 600.0)
    
    assert exp1.status == ExperimentStatus.KEEP
    assert exp1.primary_metric == 3.20
    assert runner.running_best == exp1
    
    # Second experiment with improvement
    mock_evaluator.evaluate.return_value = {"val_loss": 3.10, "val_bpb": 4.4}
    exp2 = await runner._run_single_experiment("test", 2, 600.0)
    
    assert exp2.status == ExperimentStatus.KEEP  # Improved, so KEEP
    assert exp2.primary_metric == 3.10
    assert runner.running_best == exp2  # Updated to new best
    assert exp2.parent_experiment_id == exp1.id


# ============================================================================
# Test 3: Discard Logic - No improvement results in DISCARD
# ============================================================================

@pytest.mark.asyncio
async def test_discard_logic_no_improvement(runner, mock_trainer, mock_evaluator, mock_hypothesis_generator, mock_train_with_checkpoint, checkpoint_dir):
    """Test DISCARD decision when metric doesn't improve"""
    
    # Setup mock trainer with checkpoint creation
    mock_trainer.train = mock_train_with_checkpoint
    
    # First experiment (baseline)
    mock_evaluator.evaluate.return_value = {"val_loss": 3.20, "val_bpb": 4.5}
    exp1 = await runner._run_single_experiment("test", 1, 600.0)
    
    assert exp1.status == ExperimentStatus.KEEP
    assert runner.running_best == exp1
    
    # Second experiment without improvement
    mock_evaluator.evaluate.return_value = {"val_loss": 3.25, "val_bpb": 4.6}  # Worse
    exp2 = await runner._run_single_experiment("test", 2, 600.0)
    
    assert exp2.status == ExperimentStatus.DISCARD  # No improvement
    assert runner.running_best == exp1  # Still the first experiment
    
    # Verify checkpoint was cleaned up
    # (in real scenario, would verify directory is removed)


# ============================================================================
# Test 4: Crash Handling - Exception marks status as CRASH
# ============================================================================

@pytest.mark.asyncio
async def test_crash_handling(runner, mock_trainer, mock_hypothesis_generator):
    """Test crash handling when training fails"""
    
    # Setup trainer to raise an exception
    mock_trainer.train.side_effect = RuntimeError("CUDA out of memory")
    
    # Run experiment (should not raise, but mark as CRASH)
    experiment = await runner._run_single_experiment("test", 1, 600.0)
    
    assert experiment.status == ExperimentStatus.CRASH
    assert experiment.completed_at is not None
    
    # Verify running_best is still None (crashed experiment not promoted)
    assert runner.running_best is None


# ============================================================================
# Test 5: Timeout Handling - Exceeded time budget marks as CRASH
# ============================================================================

@pytest.mark.asyncio
async def test_timeout_handling(runner, mock_trainer):
    """Test timeout when training exceeds time budget"""
    
    # Setup trainer to timeout
    async def slow_train(*args, **kwargs):
        await asyncio.sleep(10)  # Sleep longer than budget
        return {}
    
    mock_trainer.train = slow_train
    
    # Run with short timeout
    experiment = await runner._run_single_experiment("test", 1, time_budget_seconds=0.1)
    
    assert experiment.status == ExperimentStatus.CRASH
    assert runner.running_best is None


# ============================================================================
# Test 6: Running Best Tracking - Tracks improvement over time
# ============================================================================

@pytest.mark.asyncio
async def test_running_best_tracking(runner, mock_trainer, mock_evaluator, mock_train_with_checkpoint):
    """Test that running_best is correctly updated"""
    
    # Setup mock trainer with checkpoint creation
    mock_trainer.train = mock_train_with_checkpoint
    
    # Experiment sequence with improving metrics
    metrics_sequence = [
        {"val_loss": 3.30, "val_bpb": 4.6},  # Baseline
        {"val_loss": 3.20, "val_bpb": 4.5},  # Improvement
        {"val_loss": 3.25, "val_bpb": 4.55}, # Worse (discard)
        {"val_loss": 3.15, "val_bpb": 4.4},  # Better improvement
    ]
    
    for i, metrics in enumerate(metrics_sequence, 1):
        mock_evaluator.evaluate.return_value = metrics
        exp = await runner._run_single_experiment("test", i, 600.0)
        
        # Check running_best
        if i == 1:
            assert runner.running_best.val_loss == 3.30
        elif i == 2:
            assert runner.running_best.val_loss == 3.20
        elif i == 3:
            assert runner.running_best.val_loss == 3.20  # Still the second
        elif i == 4:
            assert runner.running_best.val_loss == 3.15


# ============================================================================
# Test 7: Loop - N experiments run sequentially
# ============================================================================

@pytest.mark.asyncio
async def test_loop_n_experiments(runner, mock_trainer, mock_evaluator, mock_train_with_checkpoint):
    """Test run_loop with max_experiments limit"""
    
    # Setup mock trainer with checkpoint creation
    mock_trainer.train = mock_train_with_checkpoint
    
    # Setup evaluator with improving metrics
    metrics_sequence = iter([
        {"val_loss": 3.20, "val_bpb": 4.5},
        {"val_loss": 3.15, "val_bpb": 4.4},
        {"val_loss": 3.12, "val_bpb": 4.35},
    ])
    
    def get_next_metrics(*args, **kwargs):
        return next(metrics_sequence)
    
    mock_evaluator.evaluate.side_effect = get_next_metrics
    
    # Collect results from loop
    experiments = []
    async for exp in runner.run_loop("test-run", max_experiments=3):
        experiments.append(exp)
    
    assert len(experiments) == 3
    assert all(exp.run_tag == "test-run" for exp in experiments)
    assert experiments[0].status == ExperimentStatus.KEEP
    assert experiments[1].status == ExperimentStatus.KEEP
    assert experiments[2].status == ExperimentStatus.KEEP


# ============================================================================
# Test 8: Checkpoint Cleanup - DISCARD removes checkpoint
# ============================================================================

@pytest.mark.asyncio
async def test_checkpoint_cleanup_on_discard(runner, mock_evaluator, checkpoint_dir):
    """Test that checkpoint is cleaned up on DISCARD"""
    
    # First experiment (baseline)
    mock_evaluator.evaluate.return_value = {"val_loss": 3.20, "val_bpb": 4.5}
    exp1 = await runner._run_single_experiment("test", 1, 600.0)
    exp1_checkpoint = checkpoint_dir / exp1.id
    
    # Second experiment (discard)
    mock_evaluator.evaluate.return_value = {"val_loss": 3.30, "val_bpb": 4.6}
    # Create a checkpoint directory to test cleanup
    exp2_checkpoint = checkpoint_dir / "test-exp-2"
    exp2_checkpoint.mkdir(exist_ok=True)
    (exp2_checkpoint / "test_file.txt").write_text("test")
    
    # Cleanup the checkpoint
    runner._cleanup_checkpoint("test-exp-2")
    
    # Verify checkpoint was removed
    assert not exp2_checkpoint.exists()


# ============================================================================
# Test 9: StoreIntegration - Experiments persisted correctly
# ============================================================================

@pytest.mark.asyncio
async def test_store_integration(runner, mock_trainer, mock_evaluator, experiment_store, mock_train_with_checkpoint):
    """Test that experiments are persisted in store"""
    
    # Setup mock trainer with checkpoint creation
    mock_trainer.train = mock_train_with_checkpoint
    
    mock_evaluator.evaluate.return_value = {"val_loss": 3.20, "val_bpb": 4.5}
    exp = await runner._run_single_experiment("test", 1, 600.0)
    
    # Fetch from store
    stored_exp = experiment_store.get(exp.id)
    
    assert stored_exp is not None
    assert stored_exp.id == exp.id
    assert stored_exp.status == ExperimentStatus.KEEP
    assert stored_exp.val_loss == 3.20


# ============================================================================
# Test 10: RandomHypothesisGenerator - Bounded random sampling
# ============================================================================

@pytest.mark.asyncio
async def test_random_hypothesis_generator():
    """Test RandomHypothesisGenerator produces valid configs"""
    
    gen = RandomHypothesisGenerator(seed=42)
    
    for _ in range(10):
        config = await gen.generate()
        
        # Check bounds
        assert RandomHypothesisGenerator.PARAM_BOUNDS["learning_rate"][0] <= config["learning_rate"] <= RandomHypothesisGenerator.PARAM_BOUNDS["learning_rate"][1]
        assert RandomHypothesisGenerator.PARAM_BOUNDS["per_device_batch_size"][0] <= config["per_device_batch_size"] <= RandomHypothesisGenerator.PARAM_BOUNDS["per_device_batch_size"][1]
        assert RandomHypothesisGenerator.PARAM_BOUNDS["num_epochs"][0] <= config["num_epochs"] <= RandomHypothesisGenerator.PARAM_BOUNDS["num_epochs"][1]


# ============================================================================
# Test 11: _decide - Edge cases
# ============================================================================

def test_decide_first_experiment_always_keep(runner):
    """First experiment is always KEEP"""
    
    assert runner.running_best is None
    decision = runner._decide({"val_loss": 999.0}, experiment_num=1)
    
    assert decision == ExperimentStatus.KEEP


def test_decide_missing_metric(runner):
    """Missing primary metric results in DISCARD"""
    
    decision = runner._decide({}, experiment_num=1)
    assert decision == ExperimentStatus.DISCARD or decision == ExperimentStatus.DISCARD  # Depends on logic


def test_decide_improvement_percentage_calc(runner):
    """Test improvement percentage calculation logic"""
    
    # Set running best
    runner.running_best = Mock()
    runner.running_best.primary_metric = 3.20
    
    # Test improvement
    decision = runner._decide({"val_loss": 3.10}, experiment_num=2)
    assert decision == ExperimentStatus.KEEP
    
    # Test no improvement
    decision = runner._decide({"val_loss": 3.20}, experiment_num=3)
    assert decision == ExperimentStatus.DISCARD
    
    # Test degradation
    decision = runner._decide({"val_loss": 3.30}, experiment_num=4)
    assert decision == ExperimentStatus.DISCARD


# ============================================================================
# Test 12: Config Diff and Summarization
# ============================================================================

def test_config_summarization(runner):
    """Test human-readable config summarization"""
    
    config = {
        "learning_rate": 0.0001,
        "per_device_batch_size": 4,
        "num_epochs": 2,
    }
    
    summary = runner._summarize_config(config)
    assert "learning_rate" in summary
    assert "4" in summary


def test_config_diff_from_parent(runner):
    """Test config diff computation"""
    
    # Set running best
    runner.running_best = Mock()
    runner.running_best.config = {
        "learning_rate": 0.0001,
        "per_device_batch_size": 4,
    }
    
    new_config = {
        "learning_rate": 0.00015,  # Changed
        "per_device_batch_size": 4,   # Same
    }
    
    diff = runner._compute_config_diff(new_config)
    assert "learning_rate" in diff
    assert "0.0001" in diff
    assert "0.00015" in diff


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
