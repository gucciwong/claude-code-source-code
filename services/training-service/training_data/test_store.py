"""
Tests for training data store
"""

import pytest
import tempfile
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from training_data.models import Base, CompletionEvent, TaskTrajectory, EventType, init_db, get_session_maker
from training_data.store import TrainingDataStore


@pytest.fixture
def test_db():
    """Create a test database in a temporary file"""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    
    # Init DB
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    yield session
    
    # Windows-safe cleanup: close session and dispose engine BEFORE deleting the file
    session.close()
    engine.dispose()
    try:
        os.unlink(db_path)
    except PermissionError:
        pass  # Windows may briefly hold the lock; the OS will clean it up


def test_add_completion_event(test_db):
    """Test adding a completion event"""
    store = TrainingDataStore(test_db)
    
    event_id = store.add_completion_event(
        event_type="completion_accepted",
        prompt="def factorial(n):",
        completion=" return n * factorial(n-1)",
        language="python",
        file_path="src/math.py",
        model_id="mistral-7b",
        tokens_generated=15,
        temperature=0.7,
        top_p=0.95,
    )
    
    assert event_id is not None
    assert len(event_id) == 36  # UUID length
    
    # Verify stored
    event = test_db.query(CompletionEvent).filter(CompletionEvent.id == event_id).first()
    assert event is not None
    assert event.language == "python"


def test_sanitize_secrets(test_db):
    """Test that secrets are redacted"""
    store = TrainingDataStore(test_db)
    
    event_id = store.add_completion_event(
        event_type="completion_accepted",
        prompt="api_key = 'sk-1234567890'",
        completion=" # secret!",
        language="python",
    )
    
    event = test_db.query(CompletionEvent).filter(CompletionEvent.id == event_id).first()
    assert "[REDACTED]" in event.prompt
    assert "sk-1234567890" not in event.prompt


def test_reject_invalid_code(test_db):
    """Test that invalid code is rejected"""
    store = TrainingDataStore(test_db)
    
    with pytest.raises(ValueError):
        store.add_completion_event(
            event_type="completion_accepted",
            prompt="",  # Empty
            completion="",
            language="python",
        )


def test_reject_code_too_long(test_db):
    """Test that very long code is rejected"""
    store = TrainingDataStore(test_db)
    
    long_code = "x = " + "1" * 60000  # >50KB
    
    with pytest.raises(ValueError):
        store.add_completion_event(
            event_type="completion_accepted",
            prompt=long_code,
            completion="# done",
            language="python",
        )


def test_add_task_trajectory(test_db):
    """Test adding a task trajectory"""
    store = TrainingDataStore(test_db)
    
    task_id = store.add_task_trajectory(
        task_id="task-123",
        task_description="Implement binary search",
        task_type="feature_impl",
        steps=[
            {"action": "read_spec", "result": "understood the requirements"},
            {"action": "write_code", "result": "wrote binary_search function"},
            {"action": "run_tests", "result": "all tests passed"},
        ],
        outcome="success",
        final_code="def binary_search(arr, x): ...",
        execution_time_seconds=45.2,
        tokens_consumed=1250,
    )
    
    assert task_id == "task-123"
    
    # Verify stored
    task = test_db.query(TaskTrajectory).filter(TaskTrajectory.id == task_id).first()
    assert task is not None
    assert task.outcome == "success"
    assert len(task.steps) == 3


def test_invalid_task_outcome(test_db):
    """Test that invalid outcome is rejected"""
    store = TrainingDataStore(test_db)
    
    with pytest.raises(ValueError):
        store.add_task_trajectory(
            task_id="task-456",
            task_description="Test",
            steps=[],
            outcome="invalid_outcome",
        )


def test_get_incremental_dataset(test_db):
    """Test fetching incremental dataset"""
    store = TrainingDataStore(test_db)
    
    # Add some events
    for i in range(5):
        store.add_completion_event(
            event_type="completion_accepted",
            prompt=f"# prompt {i}",
            completion=f"# completion {i}",
            language="python",
        )
    
    # Add rejection (should not be included by default)
    store.add_completion_event(
        event_type="completion_rejected",
        prompt="# rejected",
        completion="# bad",
        language="python",
    )
    
    # Fetch dataset
    dataset = store.get_incremental_dataset(max_samples=100)
    
    assert len(dataset) == 5  # Only accepted, not rejected
    assert all(ev["event_type"] == "completion_accepted" for ev in dataset)


def test_get_stats(test_db):
    """Test getting statistics"""
    store = TrainingDataStore(test_db)
    
    # Add various events
    store.add_completion_event(
        event_type="completion_accepted",
        prompt="p1", completion="c1", language="python"
    )
    store.add_completion_event(
        event_type="completion_accepted",
        prompt="p2", completion="c2", language="python"
    )
    store.add_completion_event(
        event_type="completion_rejected",
        prompt="p3", completion="c3", language="python"
    )
    
    # Add task
    store.add_task_trajectory(
        task_id="task-1",
        task_description="test",
        steps=[],
        outcome="success",
    )
    
    stats = store.get_stats()
    
    assert stats["total_events"] == 3
    assert stats["completion_accepted"] == 2
    assert stats["completion_rejected"] == 1
    assert stats["task_completed_total"] == 1
    assert stats["task_success_rate"] == 1.0


def test_add_training_run(test_db):
    """Test adding a training run"""
    store = TrainingDataStore(test_db)
    
    run_id = store.add_training_run(
        run_type="quick",
        base_model_id="mistral-7b",
        samples_used=500,
        train_size=450,
        eval_size=50,
    )
    
    assert run_id is not None
    
    # Update with results
    store.update_training_run(
        run_id=run_id,
        status="completed",
        loss=1.25,
        eval_loss=1.35,
        duration_seconds=120.5,
        adapter_path="./models/quick/adapter",
    )
    
    run = store.get_training_run(run_id)
    assert run["status"] == "completed"
    assert run["loss"] == 1.25
    assert run["adapter_path"] == "./models/quick/adapter"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
