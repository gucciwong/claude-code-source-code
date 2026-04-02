"""
Data models for training events and completions
"""

from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, 
    Enum as SQLEnum, JSON, create_engine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


Base = declarative_base()


class EventType(str, Enum):
    """Type of training event"""
    COMPLETION_ACCEPTED = "completion_accepted"
    COMPLETION_REJECTED = "completion_rejected"
    COMPLETION_EDITED = "completion_edited"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    TEST_PASSED = "test_passed"
    TEST_FAILED = "test_failed"


class CompletionEvent(Base):
    """Training data from code completion interactions"""
    __tablename__ = "completion_events"
    
    id = Column(String, primary_key=True)  # UUID
    event_type = Column(SQLEnum(EventType), nullable=False)
    
    # Code context
    prompt = Column(String, nullable=False)  # Code before cursor
    completion = Column(String, nullable=False)  # Suggested completion
    language = Column(String, nullable=False)  # python, javascript, etc.
    file_path = Column(String)  # Project-relative path
    
    # Metadata
    model_id = Column(String)  # Which model generated this
    tokens_generated = Column(Integer)
    temperature = Column(Float)
    top_p = Column(Float)
    
    # Custom metadata (as JSON)
    event_metadata = Column(JSON)
    
    # Timestamps & version
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "event_type": self.event_type.value,
            "prompt": self.prompt,
            "completion": self.completion,
            "language": self.language,
            "file_path": self.file_path,
            "model_id": self.model_id,
            "tokens_generated": self.tokens_generated,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "event_metadata": self.event_metadata,
            "created_at": self.created_at.isoformat(),
        }


class TaskTrajectory(Base):
    """Training data from agent task execution"""
    __tablename__ = "task_trajectories"
    
    id = Column(String, primary_key=True)  # UUID (task ID)
    
    # Task description
    task_description = Column(String, nullable=False)
    task_type = Column(String)  # "bug_fix", "feature_impl", "refactor", etc.
    
    # Execution steps (as JSON array)
    steps = Column(JSON, nullable=False)  # [{ "action": "...", "result": "..." }, ...]
    
    # Outcome
    outcome = Column(String, nullable=False)  # "success", "failure", "partial"
    final_code = Column(String)  # Final code produced
    error_message = Column(String)  # If failed
    
    # Metrics
    num_steps = Column(Integer)
    execution_time_seconds = Column(Float)
    tokens_consumed = Column(Integer)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "task_description": self.task_description,
            "task_type": self.task_type,
            "steps": self.steps,
            "outcome": self.outcome,
            "final_code": self.final_code,
            "error_message": self.error_message,
            "num_steps": self.num_steps,
            "execution_time_seconds": self.execution_time_seconds,
            "tokens_consumed": self.tokens_consumed,
            "created_at": self.created_at.isoformat(),
        }


class TrainingRun(Base):
    """Metadata for a training cycle"""
    __tablename__ = "training_runs"
    
    id = Column(String, primary_key=True)  # UUID
    
    # Run config
    run_type = Column(String, nullable=False)  # "quick", "full"
    base_model_id = Column(String, nullable=False)
    
    # Input data
    samples_used = Column(Integer)
    train_size = Column(Integer)
    eval_size = Column(Integer)
    
    # Training metrics
    loss = Column(Float)
    eval_loss = Column(Float)
    duration_seconds = Column(Float)
    
    # Output
    adapter_path = Column(String)
    
    # Status
    status = Column(String, nullable=False)  # "pending", "running", "completed", "failed"
    error_message = Column(String)
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "run_type": self.run_type,
            "base_model_id": self.base_model_id,
            "samples_used": self.samples_used,
            "train_size": self.train_size,
            "eval_size": self.eval_size,
            "loss": self.loss,
            "eval_loss": self.eval_loss,
            "duration_seconds": self.duration_seconds,
            "adapter_path": self.adapter_path,
            "status": self.status,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


# Database setup
def get_db_url(db_path: str = "./data/training.db") -> str:
    """SQLite connection string"""
    return f"sqlite:///{db_path}"


def init_db(db_path: str = "./data/training.db"):
    """Initialize database and create tables"""
    engine = create_engine(get_db_url(db_path))
    Base.metadata.create_all(engine)
    return engine


def get_session_maker(db_path: str = "./data/training.db"):
    """Get SQLAlchemy session factory"""
    engine = create_engine(get_db_url(db_path), connect_args={"check_same_thread": False})
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)
