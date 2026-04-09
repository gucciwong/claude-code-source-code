"""
Autoresearch integration for Sovereign Code - Phase 3.1+

Core autonomous experiment loop for hyperparameter tuning.
Includes research program specifications (Phase 4.1) and management (Phase 4.3).
"""

from .runner import ExperimentRunner, HypothesisGenerator
from .program import SearchDimension, ResearchProgram, DEFAULT_PROGRAMS
from .store import ResearchProgramStore
from .router import router as autoresearch_router, set_store as set_autoresearch_store

__all__ = [
    "ExperimentRunner",
    "HypothesisGenerator",
    "SearchDimension",
    "ResearchProgram",
    "DEFAULT_PROGRAMS",
    "ResearchProgramStore",
    "autoresearch_router",
    "set_autoresearch_store",
]

__all__ = [
    "ExperimentRunner",
    "HypothesisGenerator",
    "SearchDimension",
    "ResearchProgram",
    "DEFAULT_PROGRAMS",
]
