"""
TDD: Failing tests first — Finetune module for training-service.
Run: cd services/training-service && python -m pytest tests/test_finetune.py -v
"""

import pytest
import sys
import os

# Ensure training-service root is on path for relative imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from finetune.models import FinetuneConfig, FinetuneJob, Checkpoint
from finetune.job_manager import FinetuneJobManager


# ============================================================================
# FinetuneConfig defaults
# ============================================================================

def test_finetune_config_defaults():
    """FinetuneConfig has correct defaults (learning_rate=3e-4, epochs=3)"""
    cfg = FinetuneConfig(base_model="mistral-7b", dataset_path="./data.jsonl")
    assert cfg.learning_rate == 3e-4
    assert cfg.epochs == 3
    assert cfg.batch_size == 4
    assert cfg.lora_rank == 8
    assert cfg.output_dir == "./finetune-output"


# ============================================================================
# FinetuneJob defaults
# ============================================================================

def test_finetune_job_default_loss_history():
    """FinetuneJob has default loss_history as empty list"""
    job = FinetuneJob(job_id="abc", config={})
    assert job.loss_history == []


# ============================================================================
# FinetuneJobManager — start_job
# ============================================================================

def test_start_job_creates_queued_job():
    """start_job creates a job with queued status"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="llama-7b", dataset_path="./ds.jsonl")
    job = mgr.start_job(cfg)
    assert job.status == "queued"


def test_start_job_returns_job_with_correct_config():
    """start_job returns job with correct config"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="mistral-7b", dataset_path="./data.jsonl", epochs=5)
    job = mgr.start_job(cfg)
    assert job.config["base_model"] == "mistral-7b"
    assert job.config["epochs"] == 5


# ============================================================================
# FinetuneJobManager — get_job
# ============================================================================

def test_get_job_returns_none_for_unknown():
    """get_job returns None for unknown job_id"""
    mgr = FinetuneJobManager()
    assert mgr.get_job("nonexistent-id") is None


def test_get_job_returns_job_for_known_id():
    """get_job returns the job for known job_id"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="m", dataset_path="d")
    job = mgr.start_job(cfg)
    fetched = mgr.get_job(job.job_id)
    assert fetched is not None
    assert fetched.job_id == job.job_id


# ============================================================================
# FinetuneJobManager — stop_job
# ============================================================================

def test_stop_job_returns_true_for_existing():
    """stop_job returns True for existing job"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="m", dataset_path="d")
    job = mgr.start_job(cfg)
    assert mgr.stop_job(job.job_id) is True


def test_stop_job_sets_status_to_stopped():
    """stop_job sets status to 'stopped'"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="m", dataset_path="d")
    job = mgr.start_job(cfg)
    mgr.stop_job(job.job_id)
    assert mgr.get_job(job.job_id).status == "stopped"


def test_stop_job_returns_false_for_unknown():
    """stop_job returns False for unknown job_id"""
    mgr = FinetuneJobManager()
    assert mgr.stop_job("unknown-id") is False


# ============================================================================
# FinetuneJobManager — list_jobs
# ============================================================================

def test_list_jobs_empty_initially():
    """list_jobs returns empty list initially"""
    mgr = FinetuneJobManager()
    assert mgr.list_jobs() == []


def test_list_jobs_returns_all_started_jobs():
    """list_jobs returns all started jobs"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="m", dataset_path="d")
    mgr.start_job(cfg)
    mgr.start_job(cfg)
    assert len(mgr.list_jobs()) == 2


# ============================================================================
# FinetuneJobManager — checkpoints
# ============================================================================

def test_add_checkpoint_stores_checkpoint():
    """add_checkpoint stores checkpoint"""
    mgr = FinetuneJobManager()
    ckpt = Checkpoint(name="ckpt-1", epoch=1, loss=0.75, path="./output/ckpt-1")
    mgr.add_checkpoint(ckpt)
    assert len(mgr.list_checkpoints()) == 1


def test_list_checkpoints_returns_all():
    """list_checkpoints returns all checkpoints"""
    mgr = FinetuneJobManager()
    mgr.add_checkpoint(Checkpoint(name="a", epoch=1, loss=1.0, path="./a"))
    mgr.add_checkpoint(Checkpoint(name="b", epoch=2, loss=0.5, path="./b"))
    ckpts = mgr.list_checkpoints()
    assert len(ckpts) == 2


# ============================================================================
# FinetuneJobManager — simulate_progress
# ============================================================================

def test_simulate_progress_sets_status_running():
    """simulate_progress sets status to 'running' on first call"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="m", dataset_path="d")
    job = mgr.start_job(cfg)
    updated = mgr.simulate_progress(job.job_id)
    assert updated.status == "running"


def test_simulate_progress_appends_to_loss_history():
    """simulate_progress appends to loss_history"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="m", dataset_path="d")
    job = mgr.start_job(cfg)
    mgr.simulate_progress(job.job_id)
    assert len(mgr.get_job(job.job_id).loss_history) == 1


def test_simulate_progress_increments_current_epoch():
    """simulate_progress increments current_epoch"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="m", dataset_path="d", epochs=3)
    job = mgr.start_job(cfg)
    for _ in range(5):
        mgr.simulate_progress(job.job_id)
    updated = mgr.get_job(job.job_id)
    assert updated.current_epoch > 0


def test_simulate_progress_completes_at_full_progress():
    """simulate_progress sets status to 'complete' when progress reaches 1.0"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="m", dataset_path="d", epochs=3)
    job = mgr.start_job(cfg)
    # 10 steps to reach 100%
    for _ in range(10):
        mgr.simulate_progress(job.job_id)
    updated = mgr.get_job(job.job_id)
    assert updated.status == "complete"
    assert updated.progress >= 1.0


def test_simulate_progress_adds_checkpoint_on_completion():
    """simulate_progress adds checkpoint on completion"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="m", dataset_path="d", epochs=3)
    job = mgr.start_job(cfg)
    for _ in range(10):
        mgr.simulate_progress(job.job_id)
    assert len(mgr.list_checkpoints()) == 1


def test_simulate_progress_does_nothing_when_complete():
    """simulate_progress does nothing when job is already complete"""
    mgr = FinetuneJobManager()
    cfg = FinetuneConfig(base_model="m", dataset_path="d", epochs=3)
    job = mgr.start_job(cfg)
    for _ in range(10):
        mgr.simulate_progress(job.job_id)
    loss_count = len(mgr.get_job(job.job_id).loss_history)
    # one more call should not add to loss_history
    mgr.simulate_progress(job.job_id)
    assert len(mgr.get_job(job.job_id).loss_history) == loss_count


# ============================================================================
# FinetuneJobManager — count
# ============================================================================

def test_count_returns_number_of_jobs():
    """count returns number of jobs"""
    mgr = FinetuneJobManager()
    assert mgr.count() == 0
    cfg = FinetuneConfig(base_model="m", dataset_path="d")
    mgr.start_job(cfg)
    mgr.start_job(cfg)
    assert mgr.count() == 2
