"""
Data models for training events and completions
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    Enum as SQLEnum, JSON, create_engine, text, inspect
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


class EventType(str, Enum):
    """Type of training event"""
    COMPLETION_ACCEPTED = "completion_accepted"
    COMPLETION_REJECTED = "completion_rejected"
    COMPLETION_EDITED = "completion_edited"
    COMPLETION_SUGGESTED = "completion_suggested"
    COMPLETION_EDITED_AFTER_ACCEPT = "completion_edited_after_accept"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    TEST_PASSED = "test_passed"
    TEST_FAILED = "test_failed"
    # §3.2 Inference lifecycle events
    INFERENCE_REQUEST_STARTED = "inference_request_started"
    INFERENCE_FIRST_TOKEN_EMITTED = "inference_first_token_emitted"
    INFERENCE_REQUEST_COMPLETED = "inference_request_completed"
    INFERENCE_REQUEST_FAILED = "inference_request_failed"


class CompletionEvent(Base):
    """Training data from code completion interactions"""
    __tablename__ = "completion_events"
    
    id = Column(String, primary_key=True)  # UUID
    event_type = Column(SQLEnum(EventType), nullable=False)
    
    # §3.1 KPI Common envelope fields
    event_name = Column(String)
    event_version = Column(String, default="1.0")
    correlation_id = Column(String)
    session_id = Column(String)
    installation_id_hash = Column(String)
    project_id_hash = Column(String)
    client_version = Column(String)
    platform = Column(String)
    runtime_backend = Column(String)
    
    # Code context
    prompt = Column(String, nullable=False)  # Code before cursor
    completion = Column(String, nullable=False)  # Suggested completion
    language = Column(String, nullable=False)  # python, javascript, etc.
    file_path = Column(String)  # Project-relative path
    
    # Inference metadata
    model_id = Column(String)  # Which model generated this
    tokens_generated = Column(Integer)
    temperature = Column(Float)
    top_p = Column(Float)
    
    # §3.2 Completion-specific KPI fields
    completion_type = Column(String)            # chat | inline | agent
    suggestion_length_tokens = Column(Integer)
    accepted_boolean = Column(Boolean)
    edit_distance_after_accept = Column(Integer)
    
    # §3.2 Inference-specific KPI fields
    first_token_latency_ms = Column(Float)
    tokens_per_second = Column(Float)
    backend_name = Column(String)
    model_quantization = Column(String)
    prompt_tokens = Column(Integer)
    completion_tokens = Column(Integer)
    error_message = Column(String)
    
    # Custom metadata (as JSON)
    event_metadata = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "event_type": self.event_type.value if self.event_type else None,
            "event_name": self.event_name,
            "event_version": self.event_version,
            "correlation_id": self.correlation_id,
            "session_id": self.session_id,
            "installation_id_hash": self.installation_id_hash,
            "project_id_hash": self.project_id_hash,
            "client_version": self.client_version,
            "platform": self.platform,
            "runtime_backend": self.runtime_backend,
            "prompt": self.prompt,
            "completion": self.completion,
            "language": self.language,
            "file_path": self.file_path,
            "model_id": self.model_id,
            "tokens_generated": self.tokens_generated,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "completion_type": self.completion_type,
            "suggestion_length_tokens": self.suggestion_length_tokens,
            "accepted_boolean": self.accepted_boolean,
            "edit_distance_after_accept": self.edit_distance_after_accept,
            "first_token_latency_ms": self.first_token_latency_ms,
            "tokens_per_second": self.tokens_per_second,
            "backend_name": self.backend_name,
            "model_quantization": self.model_quantization,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "error_message": self.error_message,
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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
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
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
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
    run_migrations(engine)
    return engine


def run_migrations(engine) -> None:
    """Idempotent ALTER TABLE migrations — add new KPI columns to existing tables.
    SQLAlchemy create_all() does not ALTER existing tables, so we handle it here.
    Safe to run multiple times; skips columns that already exist.
    """
    inspector = inspect(engine)
    tables = {t: {c["name"] for c in inspector.get_columns(t)}
              for t in inspector.get_table_names()}

    # KPI envelope + domain-specific columns to add to completion_events
    completion_event_cols = [
        ("event_name",                  "VARCHAR"),
        ("event_version",               "VARCHAR"),
        ("correlation_id",              "VARCHAR"),
        ("session_id",                  "VARCHAR"),
        ("installation_id_hash",        "VARCHAR"),
        ("project_id_hash",             "VARCHAR"),
        ("client_version",              "VARCHAR"),
        ("platform",                    "VARCHAR"),
        ("runtime_backend",             "VARCHAR"),
        ("completion_type",             "VARCHAR"),
        ("suggestion_length_tokens",    "INTEGER"),
        ("accepted_boolean",            "BOOLEAN"),
        ("edit_distance_after_accept",  "INTEGER"),
        ("first_token_latency_ms",      "FLOAT"),
        ("tokens_per_second",           "FLOAT"),
        ("backend_name",                "VARCHAR"),
        ("model_quantization",          "VARCHAR"),
        ("prompt_tokens",               "INTEGER"),
        ("completion_tokens",           "INTEGER"),
        ("error_message",               "VARCHAR"),
    ]

    existing = tables.get("completion_events", set())
    with engine.connect() as conn:
        for col_name, col_type in completion_event_cols:
            if col_name not in existing:
                conn.execute(text(
                    f"ALTER TABLE completion_events ADD COLUMN {col_name} {col_type}"
                ))
        conn.commit()


def get_session_maker(db_path: str = "./data/training.db"):
    """Get SQLAlchemy session factory"""
    engine = create_engine(get_db_url(db_path), connect_args={"check_same_thread": False})
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)
