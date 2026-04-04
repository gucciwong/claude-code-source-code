"""
Experiment data model for autoresearch integration (Phase 1.1)

Defines Experiment model and ExperimentStatus enum for autonomous AI-driven
hyperparameter experimentation in Sovereign Code's QLoRA training pipeline.

Attributes align with autoresearch results.tsv concept plus extensions for
training infrastructure tracking.
"""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class ExperimentStatus(str, Enum):
    """Status classification for experiment lifecycle and autoresearch decisions"""
    PENDING = "pending"      # Not yet started
    RUNNING = "running"      # Currently executing
    KEEP = "keep"            # Validation metric improved - worth pursuing
    DISCARD = "discard"      # Validation metric same or worse - abandon variant
    CRASH = "crash"          # Training failed - error or resource constraint


class Experiment(BaseModel):
    """
    Complete experiment record for autonomous hyperparameter tuning
    
    Replaces FinetuneJob for autoresearch integration. Tracks:
    - Configuration and execution metadata
    - Training metrics (primary and secondary)
    - Resource usage
    - Lineage and parent-child relationships
    - Timestamped lifecycle
    """
    
    # Identification & Tagging
    id: str                                    # UUID for this experiment
    run_tag: str                               # e.g. "autoresearch/jun15" - groups related runs
    commit_hash: Optional[str] = None          # Checkpoint version identifier
    
    # Configuration & Intent
    config: Dict[str, Any]                     # Full training config snapshot (hyperparameters)
    description: str                           # What this experiment tried (human-readable rationale)
    
    # Status & Outcome
    status: ExperimentStatus                   # Current lifecycle state
    
    # Metrics - Primary (optimized) and Secondary (benchmarks)
    val_loss: Optional[float] = None           # Validation loss
    val_bpb: Optional[float] = None            # Validation bits-per-byte
    primary_metric: Optional[float] = None     # The metric being optimized (e.g. val_loss)
    secondary_metrics: Dict[str, Any] = Field(default_factory=dict)  # Additional benchmarks (e.g. {"accuracy": 0.92})
    
    # Resource Tracking
    peak_vram_mb: Optional[float] = None       # Peak GPU memory used in MB
    training_seconds: Optional[float] = None   # Active training duration
    total_seconds: Optional[float] = None      # Total execution time including overhead
    
    # Timestamps
    created_at: datetime                       # When record was created
    started_at: Optional[datetime] = None      # When training started
    completed_at: Optional[datetime] = None    # When training finished
    
    # Lineage & Evolution
    parent_experiment_id: Optional[str] = None # Which experiment this branched from (for tree structure)
    changes_from_parent: str = ""              # Description of what changed from parent config
