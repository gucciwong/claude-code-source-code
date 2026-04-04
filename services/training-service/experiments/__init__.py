"""
Experiment module for autoresearch integration (Phase 1)

Provides Experiment model (Phase 1.1) and ExperimentStore (Phase 1.2)
for autonomous hyperparameter tuning and experiment tracking.
"""

from .models import Experiment, ExperimentStatus
from .store import ExperimentStore

__all__ = [
    "Experiment",
    "ExperimentStatus",
    "ExperimentStore",
]

