"""
Autoresearch integration for Sovereign Code - Phase 3.1+

Core autonomous experiment loop for hyperparameter tuning.
Includes research program specifications (Phase 4.1).
"""

from .runner import ExperimentRunner, HypothesisGenerator
from .program import SearchDimension, ResearchProgram, DEFAULT_PROGRAMS

__all__ = [
    "ExperimentRunner",
    "HypothesisGenerator",
    "SearchDimension",
    "ResearchProgram",
    "DEFAULT_PROGRAMS",
]
