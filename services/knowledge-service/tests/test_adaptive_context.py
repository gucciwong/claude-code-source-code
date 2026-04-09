"""
Tests for Adaptive Context Window (ACW) — Innovation #8
"""

import pytest
from adaptive_context import (
    TaskMode,
    ContextSource,
    ContextBudget,
    ContextItem,
    ComposedContext,
    TaskDetector,
    ContextComposer,
    TASK_BUDGET_PROFILES,
)


# ---------------------------------------------------------------------------
# TaskMode & ContextSource enums
# ---------------------------------------------------------------------------


class TestTaskMode:
    """Tests for TaskMode enum."""

    def test_all_modes_exist(self):
        expected = ["debugging", "writing", "refactoring", "testing",
                    "reviewing", "exploring", "documenting", "unknown"]
        actual = [m.value for m in TaskMode]
        for mode in expected:
            assert mode in actual

    def test_mode_count(self):
        assert len(TaskMode) == 8


class TestContextSource:
    """Tests for ContextSource enum."""

    def test_all_sources_exist(self):
        expected = ["open_files", "recent_changes", "pkl_patterns",
                    "execution_traces", "git_history", "team_patterns",
                    "api_surface", "dependencies", "test_files", "documentation"]
        actual = [s.value for s in ContextSource]
        for source in expected:
            assert source in actual

    def test_source_count(self):
        assert len(ContextSource) == 10


# ---------------------------------------------------------------------------
# ContextBudget
# ---------------------------------------------------------------------------


class TestContextBudget:
    """Tests for ContextBudget token allocation."""

    def test_default_total_tokens(self):
        budget = ContextBudget()
        assert budget.total_tokens == 4096

    def test_allocate_and_get(self):
        budget = ContextBudget()
        budget.allocate(ContextSource.OPEN_FILES, 1200)
        assert budget.get_allocation(ContextSource.OPEN_FILES) == 1200

    def test_get_unallocated_returns_zero(self):
        budget = ContextBudget()
        assert budget.get_allocation(ContextSource.GIT_HISTORY) == 0

    def test_remaining(self):
        budget = ContextBudget(total_tokens=4096)
        budget.allocate(ContextSource.OPEN_FILES, 1000)
        budget.allocate(ContextSource.DEPENDENCIES, 500)
        assert budget.remaining() == 2596

    def test_remaining_cannot_go_negative(self):
        budget = ContextBudget(total_tokens=100)
        budget.allocate(ContextSource.OPEN_FILES, 200)
        assert budget.remaining() == 0

    def test_to_dict(self):
        budget = ContextBudget(total_tokens=4096)
        budget.allocate(ContextSource.OPEN_FILES, 1000)
        d = budget.to_dict()
        assert d["total_tokens"] == 4096
        assert "open_files" in d["allocations"]
        assert d["remaining"] == 3096


# ---------------------------------------------------------------------------
# ContextItem
# ---------------------------------------------------------------------------


class TestContextItem:
    """Tests for ContextItem data class."""

    def test_default_priority(self):
        item = ContextItem(source=ContextSource.OPEN_FILES, content="hello")
        assert item.priority == 0.5

    def test_to_dict(self):
        item = ContextItem(
            source=ContextSource.OPEN_FILES,
            content="some code content here",
            priority=0.8,
            token_count=50,
            file_path="main.py",
            relevance_score=0.9,
        )
        d = item.to_dict()
        assert d["source"] == "open_files"
        assert d["priority"] == 0.8
        assert d["token_count"] == 50
        assert d["file_path"] == "main.py"

    def test_content_truncated_in_to_dict(self):
        long_content = "x" * 500
        item = ContextItem(source=ContextSource.OPEN_FILES, content=long_content)
        d = item.to_dict()
        assert len(d["content"]) <= 200


# ---------------------------------------------------------------------------
# ComposedContext
# ---------------------------------------------------------------------------


class TestComposedContext:
    """Tests for ComposedContext data class."""

    def test_to_dict(self):
        budget = ContextBudget(total_tokens=4096)
        ctx = ComposedContext(
            task_mode=TaskMode.DEBUGGING,
            budget=budget,
            items=[],
            total_tokens_used=0,
        )
        d = ctx.to_dict()
        assert d["task_mode"] == "debugging"
        assert d["total_tokens_used"] == 0
        assert d["item_count"] == 0


# ---------------------------------------------------------------------------
# TaskDetector
# ---------------------------------------------------------------------------


class TestTaskDetector:
    """Tests for TaskDetector mode detection."""

    def setup_method(self):
        self.detector = TaskDetector()

    def test_detect_debugging(self):
        assert self.detector.detect("Fix the login bug") == TaskMode.DEBUGGING

    def test_detect_writing(self):
        assert self.detector.detect("Create a new feature for user auth") == TaskMode.WRITING

    def test_detect_refactoring(self):
        assert self.detector.detect("Refactor the database module") == TaskMode.REFACTORING

    def test_detect_testing(self):
        assert self.detector.detect("Add test coverage for the calculator") == TaskMode.TESTING

    def test_detect_reviewing(self):
        assert self.detector.detect("Review the PR changes") == TaskMode.REVIEWING

    def test_detect_exploring(self):
        assert self.detector.detect("Explore the codebase structure") == TaskMode.EXPLORING

    def test_detect_documenting(self):
        assert self.detector.detect("Document the API endpoints") == TaskMode.DOCUMENTING

    def test_detect_unknown(self):
        assert self.detector.detect("Hello world") == TaskMode.UNKNOWN

    def test_file_signals_boost_testing(self):
        result = self.detector.detect("check this", open_files=["test_auth.py"])
        # "check" matches reviewing, but test file boosts testing
        assert result in (TaskMode.TESTING, TaskMode.REVIEWING)

    def test_file_signals_boost_documenting(self):
        result = self.detector.detect("update this", open_files=["README.md"])
        assert result in (TaskMode.DOCUMENTING, TaskMode.WRITING)

    def test_multiple_keywords_highest_wins(self):
        # "fix" = debugging + "test" = testing, both score 2
        # But "fix" also matches, so it could be either
        result = self.detector.detect("fix the test failure")
        assert result in (TaskMode.DEBUGGING, TaskMode.TESTING)


# ---------------------------------------------------------------------------
# ContextComposer
# ---------------------------------------------------------------------------


class TestContextComposer:
    """Tests for ContextComposer high-level API."""

    def setup_method(self):
        self.composer = ContextComposer()

    def test_compose_returns_composed_context(self):
        ctx = self.composer.compose(prompt="Fix the bug", total_tokens=4096)
        assert isinstance(ctx, ComposedContext)

    def test_compose_detects_task_mode(self):
        ctx = self.composer.compose(prompt="Fix the bug")
        assert ctx.task_mode == TaskMode.DEBUGGING

    def test_compose_allocates_budget(self):
        ctx = self.composer.compose(prompt="Fix the bug", total_tokens=8192)
        assert ctx.budget.total_tokens == 8192
        # Debugging profile should allocate to execution_traces
        assert ctx.budget.get_allocation(ContextSource.EXECUTION_TRACES) > 0

    def test_compose_with_available_sources(self):
        items = [
            ContextItem(
                source=ContextSource.OPEN_FILES,
                content="def login(): pass",
                priority=0.9,
                token_count=100,
                file_path="auth.py",
            ),
            ContextItem(
                source=ContextSource.OPEN_FILES,
                content="def logout(): pass",
                priority=0.7,
                token_count=80,
                file_path="auth.py",
            ),
        ]
        available = {ContextSource.OPEN_FILES: items}
        ctx = self.composer.compose(
            prompt="Fix the login bug",
            total_tokens=4096,
            available_sources=available,
        )
        assert len(ctx.items) > 0
        assert ctx.total_tokens_used > 0

    def test_compose_respects_token_budget(self):
        items = [
            ContextItem(
                source=ContextSource.OPEN_FILES,
                content=f"line {i}",
                priority=0.9 - i * 0.01,
                token_count=2000,
                file_path=f"file{i}.py",
            )
            for i in range(5)
        ]
        available = {ContextSource.OPEN_FILES: items}
        ctx = self.composer.compose(
            prompt="Fix the bug",
            total_tokens=3000,
            available_sources=available,
        )
        assert ctx.total_tokens_used <= 3000

    def test_compose_empty_sources(self):
        ctx = self.composer.compose(prompt="Fix the bug")
        assert ctx.items == []
        assert ctx.total_tokens_used == 0

    def test_record_feedback(self):
        self.composer.record_feedback(ContextSource.OPEN_FILES, accepted=True)
        self.composer.record_feedback(ContextSource.OPEN_FILES, accepted=False)
        stats = self.composer.get_feedback_stats()
        assert "open_files" in stats["feedback"]

    def test_feedback_adjusts_priority(self):
        # Give positive feedback to open_files
        for _ in range(10):
            self.composer.record_feedback(ContextSource.OPEN_FILES, accepted=True)

        items = [
            ContextItem(
                source=ContextSource.OPEN_FILES,
                content="code",
                priority=0.5,
                token_count=100,
            ),
        ]
        available = {ContextSource.OPEN_FILES: items}
        ctx = self.composer.compose(
            prompt="Fix the bug",
            total_tokens=4096,
            available_sources=available,
        )
        # With positive feedback, priority should be boosted
        if ctx.items:
            assert ctx.items[0].priority > 0.5

    def test_get_feedback_stats(self):
        self.composer.record_feedback(ContextSource.OPEN_FILES, accepted=True)
        stats = self.composer.get_feedback_stats()
        assert "feedback" in stats
        assert "sources_tracked" in stats
        assert stats["sources_tracked"] >= 1

    def test_budget_profiles_cover_all_modes(self):
        for mode in TaskMode:
            assert mode in TASK_BUDGET_PROFILES

    def test_budget_profiles_sum_approximately_one(self):
        for mode, profile in TASK_BUDGET_PROFILES.items():
            total = sum(profile.values())
            # Allow small rounding errors
            assert 0.9 <= total <= 1.1, f"{mode.value} budget sums to {total}"
