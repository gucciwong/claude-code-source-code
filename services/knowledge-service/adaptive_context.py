"""
Adaptive Context Window (ACW) — Innovation #8

Intelligent context window manager that dynamically adjusts what goes into
the context based on the current task. For a bug fix, it prioritizes the
buggy function + callers + recent changes. For a new feature, it prioritizes
the API surface + similar existing features + PKL patterns.

Priority: P1 | Service: knowledge-service (port 8003)
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, List, Tuple
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class TaskMode(Enum):
    """Current task mode detected by the context composer."""
    DEBUGGING = "debugging"
    WRITING = "writing"
    REFACTORING = "refactoring"
    TESTING = "testing"
    REVIEWING = "reviewing"
    EXPLORING = "exploring"
    DOCUMENTING = "documenting"
    UNKNOWN = "unknown"


class ContextSource(Enum):
    """Sources of context for the context window."""
    OPEN_FILES = "open_files"
    RECENT_CHANGES = "recent_changes"
    PKL_PATTERNS = "pkl_patterns"
    EXECUTION_TRACES = "execution_traces"
    GIT_HISTORY = "git_history"
    TEAM_PATTERNS = "team_patterns"
    API_SURFACE = "api_surface"
    DEPENDENCIES = "dependencies"
    TEST_FILES = "test_files"
    DOCUMENTATION = "documentation"


@dataclass
class ContextBudget:
    """Token budget allocation across context sources."""
    total_tokens: int = 4096
    allocations: Dict[ContextSource, int] = field(default_factory=dict)

    def allocate(self, source: ContextSource, tokens: int) -> None:
        self.allocations[source] = tokens

    def get_allocation(self, source: ContextSource) -> int:
        return self.allocations.get(source, 0)

    def remaining(self) -> int:
        used = sum(self.allocations.values())
        return max(0, self.total_tokens - used)

    def to_dict(self) -> dict:
        return {
            "total_tokens": self.total_tokens,
            "allocations": {k.value: v for k, v in self.allocations.items()},
            "remaining": self.remaining(),
        }


@dataclass
class ContextItem:
    """A single item in the context window."""
    source: ContextSource
    content: str
    priority: float = 0.5  # 0.0-1.0
    token_count: int = 0
    file_path: str = ""
    relevance_score: float = 0.0

    def to_dict(self) -> dict:
        return {
            "source": self.source.value,
            "content": self.content[:200],
            "priority": round(self.priority, 3),
            "token_count": self.token_count,
            "file_path": self.file_path,
            "relevance_score": round(self.relevance_score, 3),
        }


@dataclass
class ComposedContext:
    """The composed context window for a task."""
    task_mode: TaskMode
    budget: ContextBudget
    items: List[ContextItem] = field(default_factory=list)
    total_tokens_used: int = 0
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "task_mode": self.task_mode.value,
            "budget": self.budget.to_dict(),
            "items": [i.to_dict() for i in self.items],
            "total_tokens_used": self.total_tokens_used,
            "item_count": len(self.items),
        }


# Default budget allocations per task mode (percentage of total tokens)
TASK_BUDGET_PROFILES: Dict[TaskMode, Dict[ContextSource, float]] = {
    TaskMode.DEBUGGING: {
        ContextSource.OPEN_FILES: 0.30,
        ContextSource.EXECUTION_TRACES: 0.25,
        ContextSource.RECENT_CHANGES: 0.20,
        ContextSource.DEPENDENCIES: 0.10,
        ContextSource.PKL_PATTERNS: 0.05,
        ContextSource.TEST_FILES: 0.10,
    },
    TaskMode.WRITING: {
        ContextSource.OPEN_FILES: 0.20,
        ContextSource.API_SURFACE: 0.25,
        ContextSource.PKL_PATTERNS: 0.20,
        ContextSource.TEAM_PATTERNS: 0.10,
        ContextSource.DOCUMENTATION: 0.15,
        ContextSource.DEPENDENCIES: 0.10,
    },
    TaskMode.REFACTORING: {
        ContextSource.OPEN_FILES: 0.25,
        ContextSource.DEPENDENCIES: 0.25,
        ContextSource.RECENT_CHANGES: 0.15,
        ContextSource.TEST_FILES: 0.15,
        ContextSource.PKL_PATTERNS: 0.10,
        ContextSource.GIT_HISTORY: 0.10,
    },
    TaskMode.TESTING: {
        ContextSource.OPEN_FILES: 0.30,
        ContextSource.TEST_FILES: 0.25,
        ContextSource.EXECUTION_TRACES: 0.15,
        ContextSource.PKL_PATTERNS: 0.15,
        ContextSource.API_SURFACE: 0.15,
    },
    TaskMode.REVIEWING: {
        ContextSource.OPEN_FILES: 0.30,
        ContextSource.RECENT_CHANGES: 0.25,
        ContextSource.GIT_HISTORY: 0.15,
        ContextSource.TEAM_PATTERNS: 0.10,
        ContextSource.DOCUMENTATION: 0.10,
        ContextSource.TEST_FILES: 0.10,
    },
    TaskMode.EXPLORING: {
        ContextSource.OPEN_FILES: 0.20,
        ContextSource.DOCUMENTATION: 0.25,
        ContextSource.API_SURFACE: 0.20,
        ContextSource.DEPENDENCIES: 0.15,
        ContextSource.GIT_HISTORY: 0.10,
        ContextSource.PKL_PATTERNS: 0.10,
    },
    TaskMode.DOCUMENTING: {
        ContextSource.OPEN_FILES: 0.30,
        ContextSource.API_SURFACE: 0.20,
        ContextSource.GIT_HISTORY: 0.15,
        ContextSource.PKL_PATTERNS: 0.10,
        ContextSource.TEAM_PATTERNS: 0.10,
        ContextSource.DOCUMENTATION: 0.15,
    },
    TaskMode.UNKNOWN: {
        ContextSource.OPEN_FILES: 0.30,
        ContextSource.RECENT_CHANGES: 0.20,
        ContextSource.PKL_PATTERNS: 0.15,
        ContextSource.DEPENDENCIES: 0.15,
        ContextSource.DOCUMENTATION: 0.10,
        ContextSource.GIT_HISTORY: 0.10,
    },
}


class TaskDetector:
    """Detects the current task mode from user activity signals."""

    DEBUGGING_KEYWORDS = ["fix", "bug", "error", "crash", "debug", "traceback", "exception", "issue"]
    WRITING_KEYWORDS = ["create", "add", "implement", "build", "new", "write", "develop"]
    REFACTORING_KEYWORDS = ["refactor", "rename", "extract", "move", "reorganize", "clean", "simplify"]
    TESTING_KEYWORDS = ["test", "spec", "assert", "verify", "coverage", "mock"]
    REVIEWING_KEYWORDS = ["review", "check", "audit", "approve", "comment"]
    EXPLORING_KEYWORDS = ["explore", "find", "search", "where", "how does", "what is"]
    DOCUMENTING_KEYWORDS = ["document", "doc", "readme", "comment", "explain"]

    def detect(self, prompt: str, open_files: List[str] = None) -> TaskMode:
        """Detect the current task mode from a prompt and context signals.

        Args:
            prompt: The user's current prompt/query
            open_files: List of currently open file paths

        Returns:
            Detected TaskMode
        """
        prompt_lower = prompt.lower()

        scores: Dict[TaskMode, int] = {mode: 0 for mode in TaskMode}

        for kw in self.DEBUGGING_KEYWORDS:
            if kw in prompt_lower:
                scores[TaskMode.DEBUGGING] += 2
        for kw in self.WRITING_KEYWORDS:
            if kw in prompt_lower:
                scores[TaskMode.WRITING] += 2
        for kw in self.REFACTORING_KEYWORDS:
            if kw in prompt_lower:
                scores[TaskMode.REFACTORING] += 2
        for kw in self.TESTING_KEYWORDS:
            if kw in prompt_lower:
                scores[TaskMode.TESTING] += 2
        for kw in self.REVIEWING_KEYWORDS:
            if kw in prompt_lower:
                scores[TaskMode.REVIEWING] += 2
        for kw in self.EXPLORING_KEYWORDS:
            if kw in prompt_lower:
                scores[TaskMode.EXPLORING] += 2
        for kw in self.DOCUMENTING_KEYWORDS:
            if kw in prompt_lower:
                scores[TaskMode.DOCUMENTING] += 2

        # File-based signals
        if open_files:
            for f in open_files:
                if "test" in f.lower():
                    scores[TaskMode.TESTING] += 1
                if "doc" in f.lower() or "readme" in f.lower():
                    scores[TaskMode.DOCUMENTING] += 1

        if not any(scores.values()):
            return TaskMode.UNKNOWN

        return max(scores, key=lambda m: scores[m])


class ContextComposer:
    """Composes the optimal context window for the current task.

    Usage:
        composer = ContextComposer()
        context = composer.compose(
            prompt="Fix the login bug",
            open_files=["auth.py", "login.py"],
            total_tokens=4096,
        )
    """

    def __init__(self) -> None:
        self.detector = TaskDetector()
        self._feedback: Dict[str, float] = defaultdict(lambda: 0.5)  # source -> avg acceptance

    def compose(
        self,
        prompt: str,
        open_files: Optional[List[str]] = None,
        total_tokens: int = 4096,
        available_sources: Optional[Dict[ContextSource, List[ContextItem]]] = None,
    ) -> ComposedContext:
        """Compose the optimal context window for the current task.

        Args:
            prompt: The user's current prompt
            open_files: Currently open file paths
            total_tokens: Total token budget
            available_sources: Available context items by source

        Returns:
            ComposedContext with selected items
        """
        # Step 1: Detect task mode
        task_mode = self.detector.detect(prompt, open_files)

        # Step 2: Allocate token budget
        budget = self._allocate_budget(task_mode, total_tokens)

        # Step 3: Select items from available sources
        items = self._select_items(budget, available_sources or {})

        # Step 4: Apply feedback adjustments
        items = self._apply_feedback(items)

        # Step 5: Sort by priority and trim to budget
        items.sort(key=lambda i: i.priority, reverse=True)
        total_used = 0
        selected = []
        for item in items:
            if total_used + item.token_count <= total_tokens:
                selected.append(item)
                total_used += item.token_count

        logger.info(
            f"ACW: Composed context for {task_mode.value} — "
            f"{len(selected)} items, {total_used} tokens"
        )

        return ComposedContext(
            task_mode=task_mode,
            budget=budget,
            items=selected,
            total_tokens_used=total_used,
        )

    def record_feedback(
        self,
        source: ContextSource,
        accepted: bool,
    ) -> None:
        """Record whether a context source led to an accepted completion.

        This adjusts future context composition.
        """
        current = self._feedback[source.value]
        update = 1.0 if accepted else 0.0
        # Running average
        self._feedback[source.value] = current * 0.9 + update * 0.1

    def _allocate_budget(
        self,
        task_mode: TaskMode,
        total_tokens: int,
    ) -> ContextBudget:
        """Allocate token budget based on task mode."""
        budget = ContextBudget(total_tokens=total_tokens)
        profile = TASK_BUDGET_PROFILES.get(task_mode, TASK_BUDGET_PROFILES[TaskMode.UNKNOWN])

        for source, fraction in profile.items():
            tokens = int(total_tokens * fraction)
            budget.allocate(source, tokens)

        return budget

    def _select_items(
        self,
        budget: ContextBudget,
        available_sources: Dict[ContextSource, List[ContextItem]],
    ) -> List[ContextItem]:
        """Select items from available sources within budget."""
        items = []

        for source, source_items in available_sources.items():
            token_limit = budget.get_allocation(source)
            used = 0
            for item in sorted(source_items, key=lambda i: i.priority, reverse=True):
                if used + item.token_count <= token_limit:
                    items.append(item)
                    used += item.token_count

        return items

    def _apply_feedback(self, items: List[ContextItem]) -> List[ContextItem]:
        """Apply feedback-based adjustments to item priorities."""
        for item in items:
            feedback_score = self._feedback.get(item.source.value, 0.5)
            item.priority = item.priority * (0.5 + feedback_score)
        return items

    def get_feedback_stats(self) -> dict:
        """Get feedback statistics for context sources."""
        return {
            "feedback": dict(self._feedback),
            "sources_tracked": len(self._feedback),
        }
