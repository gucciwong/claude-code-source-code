"""
Research Program Model (Phase 4.1)

Defines ResearchProgram and SearchDimension models for autonomous hyperparameter research.

ResearchProgram is equivalent to autoresearch's program.md — it specifies:
- Research goals and constraints
- The hyperparameter search space (SearchDimension list)
- Strategy for hypothesis generation
- Time and experiment budgets

This is immutable once created and guides the ExperimentRunner through
autonomous research cycles.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional, List
from uuid import uuid4
from pydantic import BaseModel, Field, ConfigDict, field_validator


class SearchDimension(BaseModel):
    """One hyperparameter that can vary between experiments."""
    
    name: str                    # e.g. "lora_rank"
    type: str                    # "int", "float", "categorical"
    min_val: Optional[float] = None     # for int/float
    max_val: Optional[float] = None
    options: Optional[List[Any]] = None      # for categorical (e.g. [4, 8, 16, 32])
    current: Any                 # current value
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "lora_rank",
                "type": "int",
                "min_val": 4.0,
                "max_val": 32.0,
                "current": 8
            }
        }
    )


class ResearchProgram(BaseModel):
    """
    Equivalent of autoresearch's program.md.
    Defines the experiment goals, constraints, and search space.
    """
    
    id: str = Field(default_factory=lambda: str(uuid4()))  # UUID
    run_tag: str                      # e.g. "autoresearch/jun15"
    goal: str                         # "Minimize val_loss for Python code completion"
    description: str                  # longer explanation
    primary_metric: str               # "val_loss" or "val_bpb"
    time_budget_seconds: int = 600    # per-experiment training budget (default: 600)
    max_experiments: Optional[int] = None    # None = run indefinitely
    
    # Model & data
    base_model: str                   # HuggingFace model ID
    dataset_path: str                 # training data location
    
    # Search space
    search_dimensions: List[SearchDimension]
    
    # Constraints
    max_vram_mb: Optional[float] = None   # soft VRAM constraint
    simplicity_preference: float = 0.5    # 0.0-1.0, higher = prefer simpler configs
    
    # Strategy for generating hypotheses
    strategy: str = "random"          # "random", "sequential", "bayesian", "agent"
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    status: str = "pending"           # pending, running, completed
    experiments_completed: int = 0
    
    @field_validator("run_tag")
    @classmethod
    def validate_run_tag(cls, v: str) -> str:
        """Ensure run_tag is non-empty"""
        if not v or len(v.strip()) == 0:
            raise ValueError("run_tag must be non-empty")
        return v
    
    @field_validator("search_dimensions")
    @classmethod
    def validate_search_dimensions(cls, v: List[SearchDimension]) -> List[SearchDimension]:
        """Ensure search_dimensions is non-empty"""
        if not v or len(v) == 0:
            raise ValueError("search_dimensions must be non-empty")
        return v
    
    @field_validator("strategy")
    @classmethod
    def validate_strategy(cls, v: str) -> str:
        """Ensure strategy is valid"""
        valid_strategies = ["random", "sequential", "bayesian", "agent"]
        if v not in valid_strategies:
            raise ValueError(f"strategy must be one of {valid_strategies}, got {v}")
        return v
    
    @field_validator("time_budget_seconds")
    @classmethod
    def validate_time_budget(cls, v: int) -> int:
        """Ensure time_budget_seconds is positive"""
        if v <= 0:
            raise ValueError("time_budget_seconds must be > 0")
        return v
    
    @field_validator("max_experiments")
    @classmethod
    def validate_max_experiments(cls, v: Optional[int]) -> Optional[int]:
        """Ensure max_experiments is positive if specified"""
        if v is not None and v <= 0:
            raise ValueError("max_experiments must be > 0 if specified")
        return v
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "run_tag": "explore-lr",
                "goal": "Find optimal learning rate for code completion",
                "primary_metric": "val_loss",
                "time_budget_seconds": 600,
                "base_model": "microsoft/phi-2",
                "dataset_path": "/data/codecompletion",
                "search_dimensions": [
                    {
                        "name": "learning_rate",
                        "type": "float",
                        "min_val": 1e-5,
                        "max_val": 5e-4,
                        "current": 2e-4
                    }
                ],
                "strategy": "bayesian"
            }
        }
    )


# ============================================================================
# Default Research Programs — Sensible presets for common scenarios
# ============================================================================

DEFAULT_PROGRAMS = {
    "quick-explore": ResearchProgram(
        run_tag="quick-explore",
        goal="Quick exploration of LoRA hyperparameters",
        description="Short experiments to quickly explore lora_rank and lora_alpha",
        time_budget_seconds=300,   # 5 min like autoresearch
        max_experiments=12,
        primary_metric="val_loss",
        base_model="microsoft/phi-2",  # or current default
        dataset_path="${DATA_PATH}",
        search_dimensions=[
            SearchDimension(
                name="lora_rank",
                type="categorical",
                options=[4, 8, 16, 32],
                current=8,
            ),
            SearchDimension(
                name="lora_alpha",
                type="categorical",
                options=[8, 16, 32, 64],
                current=16,
            ),
        ],
        strategy="random",
    ),
    "overnight-run": ResearchProgram(
        run_tag="overnight-run",
        goal="Overnight autonomous hyperparameter search",
        description="Long experiment to find optimal config over many iterations",
        time_budget_seconds=600,   # 10 min per experiment
        max_experiments=None,      # run indefinitely
        primary_metric="val_loss",
        base_model="microsoft/phi-2",
        dataset_path="${DATA_PATH}",
        search_dimensions=[
            SearchDimension(
                name="lora_rank",
                type="int",
                min_val=4.0,
                max_val=64.0,
                current=16,
            ),
            SearchDimension(
                name="lora_alpha",
                type="int",
                min_val=8.0,
                max_val=128.0,
                current=32,
            ),
            SearchDimension(
                name="learning_rate",
                type="float",
                min_val=1e-5,
                max_val=5e-4,
                current=2e-4,
            ),
            SearchDimension(
                name="batch_size",
                type="int",
                min_val=4.0,
                max_val=32.0,
                current=16,
            ),
        ],
        strategy="bayesian",
    ),
}
