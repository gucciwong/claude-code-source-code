"""
Tests for Code Archaeology Engine (CAE) — Innovation #10
"""

import pytest
import time
from execution_trace.code_archaeology import (
    ChangeIntent,
    SurvivalRating,
    CommitInfo,
    FileSurvival,
    DecisionHeatmap,
    ArchaeologyReport,
    IntentInferrer,
    CodeArchaeologyEngine,
)


# Sample commits for testing
NOW = time.time()
DAY = 86400

SAMPLE_COMMITS = [
    {
        "hash": "abc123",
        "message": "Add user authentication feature",
        "author": "alice",
        "timestamp": NOW - 30 * DAY,
        "files_changed": ["auth.py", "models/user.py"],
        "insertions": 150,
        "deletions": 0,
    },
    {
        "hash": "def456",
        "message": "Fix login bug in auth module",
        "author": "bob",
        "timestamp": NOW - 20 * DAY,
        "files_changed": ["auth.py"],
        "insertions": 10,
        "deletions": 5,
    },
    {
        "hash": "ghi789",
        "message": "Refactor database connection pooling",
        "author": "alice",
        "timestamp": NOW - 10 * DAY,
        "files_changed": ["db.py", "config.py"],
        "insertions": 50,
        "deletions": 30,
    },
    {
        "hash": "jkl012",
        "message": "Add test coverage for auth",
        "author": "charlie",
        "timestamp": NOW - 5 * DAY,
        "files_changed": ["test_auth.py"],
        "insertions": 80,
        "deletions": 0,
    },
    {
        "hash": "mno345",
        "message": "Update README with setup instructions",
        "author": "bob",
        "timestamp": NOW - 2 * DAY,
        "files_changed": ["README.md"],
        "insertions": 20,
        "deletions": 5,
    },
]


# ---------------------------------------------------------------------------
# ChangeIntent enum
# ---------------------------------------------------------------------------


class TestChangeIntent:
    """Tests for ChangeIntent enum."""

    def test_all_intents_exist(self):
        expected = ["feature", "bugfix", "refactor", "perf", "security",
                    "docs", "test", "style", "chore", "unknown"]
        actual = [i.value for i in ChangeIntent]
        for intent in expected:
            assert intent in actual

    def test_intent_count(self):
        assert len(ChangeIntent) == 10


# ---------------------------------------------------------------------------
# SurvivalRating enum
# ---------------------------------------------------------------------------


class TestSurvivalRating:
    """Tests for SurvivalRating enum."""

    def test_all_ratings_exist(self):
        expected = ["infant", "young", "mature", "ancient", "fossil"]
        actual = [r.value for r in SurvivalRating]
        for rating in expected:
            assert rating in actual

    def test_rating_count(self):
        assert len(SurvivalRating) == 5


# ---------------------------------------------------------------------------
# CommitInfo
# ---------------------------------------------------------------------------


class TestCommitInfo:
    """Tests for CommitInfo data class."""

    def test_to_dict(self):
        commit = CommitInfo(
            hash="abc123def456",
            message="Add feature for user auth",
            author="alice",
            timestamp=NOW,
            files_changed=["auth.py", "models.py"],
            insertions=100,
            deletions=20,
            intent=ChangeIntent.FEATURE,
        )
        d = commit.to_dict()
        assert d["hash"] == "abc123de"  # truncated to 8 chars
        assert d["intent"] == "feature"
        assert d["files_changed"] == 2

    def test_default_intent_is_unknown(self):
        commit = CommitInfo(hash="abc", message="test")
        assert commit.intent == ChangeIntent.UNKNOWN


# ---------------------------------------------------------------------------
# FileSurvival
# ---------------------------------------------------------------------------


class TestFileSurvival:
    """Tests for FileSurvival data class."""

    def test_to_dict(self):
        survival = FileSurvival(
            file_path="auth.py",
            total_commits=5,
            survival_rating=SurvivalRating.MATURE,
            change_frequency=1.5,
            intent_distribution={"feature": 3, "bugfix": 2},
        )
        d = survival.to_dict()
        assert d["file_path"] == "auth.py"
        assert d["survival_rating"] == "mature"
        assert d["change_frequency"] == 1.5


# ---------------------------------------------------------------------------
# DecisionHeatmap
# ---------------------------------------------------------------------------


class TestDecisionHeatmap:
    """Tests for DecisionHeatmap data class."""

    def test_to_dict(self):
        heatmap = DecisionHeatmap(
            file_path="auth.py",
            total_decisions=10,
            decision_density=0.05,
            hotspots=[{"commit": "abc12345", "intent": "feature"}],
            intent_breakdown={"feature": 5, "bugfix": 5},
        )
        d = heatmap.to_dict()
        assert d["file_path"] == "auth.py"
        assert d["total_decisions"] == 10
        assert len(d["hotspots"]) == 1


# ---------------------------------------------------------------------------
# IntentInferrer
# ---------------------------------------------------------------------------


class TestIntentInferrer:
    """Tests for IntentInferrer commit intent classification."""

    def setup_method(self):
        self.inferrer = IntentInferrer()

    def test_infer_feature(self):
        assert self.inferrer.infer("Add new user authentication") == ChangeIntent.FEATURE

    def test_infer_bugfix(self):
        assert self.inferrer.infer("Fix the login crash bug") == ChangeIntent.BUGFIX

    def test_infer_refactor(self):
        assert self.inferrer.infer("Refactor the database module") == ChangeIntent.REFACTOR

    def test_infer_perf(self):
        assert self.inferrer.infer("Optimize query performance") == ChangeIntent.PERF

    def test_infer_security(self):
        assert self.inferrer.infer("Fix security vulnerability CVE-2024") == ChangeIntent.SECURITY

    def test_infer_docs(self):
        assert self.inferrer.infer("Update README documentation") == ChangeIntent.DOCS

    def test_infer_test(self):
        assert self.inferrer.infer("Add test coverage for auth") == ChangeIntent.TEST

    def test_infer_style(self):
        assert self.inferrer.infer("Format code with prettier style") == ChangeIntent.STYLE

    def test_infer_chore(self):
        assert self.inferrer.infer("Bump dependencies and update CI config") == ChangeIntent.CHORE

    def test_infer_unknown(self):
        assert self.inferrer.infer("Miscellaneous update") == ChangeIntent.UNKNOWN

    def test_file_heuristic_test(self):
        result = self.inferrer.infer("update module", files_changed=["test_auth.py"])
        assert result == ChangeIntent.TEST

    def test_file_heuristic_docs(self):
        result = self.inferrer.infer("update module", files_changed=["README.md"])
        assert result == ChangeIntent.DOCS

    def test_file_heuristic_chore(self):
        result = self.inferrer.infer("update module", files_changed=[".github/workflows/ci.yml"])
        assert result == ChangeIntent.CHORE

    def test_file_heuristic_style(self):
        result = self.inferrer.infer("update module", files_changed=["styles.css"])
        assert result == ChangeIntent.STYLE


# ---------------------------------------------------------------------------
# CodeArchaeologyEngine
# ---------------------------------------------------------------------------


class TestCodeArchaeologyEngine:
    """Tests for the main CodeArchaeologyEngine."""

    def setup_method(self):
        self.engine = CodeArchaeologyEngine()

    def test_analyze_returns_report(self):
        report = self.engine.analyze(SAMPLE_COMMITS)
        assert isinstance(report, ArchaeologyReport)

    def test_analyze_counts_files(self):
        report = self.engine.analyze(SAMPLE_COMMITS)
        assert report.files_analyzed > 0

    def test_analyze_counts_commits(self):
        report = self.engine.analyze(SAMPLE_COMMITS)
        assert report.commits_analyzed == 5

    def test_analyze_intent_distribution(self):
        report = self.engine.analyze(SAMPLE_COMMITS)
        assert len(report.intent_distribution) > 0
        # Should have feature, bugfix, refactor, test, docs
        assert "feature" in report.intent_distribution
        assert "bugfix" in report.intent_distribution

    def test_analyze_survival_stats(self):
        report = self.engine.analyze(SAMPLE_COMMITS)
        assert len(report.survival_stats) > 0

    def test_analyze_file_survivals(self):
        report = self.engine.analyze(SAMPLE_COMMITS)
        assert len(report.file_survivals) > 0
        # auth.py should be in there
        paths = [s.file_path for s in report.file_survivals]
        assert "auth.py" in paths

    def test_analyze_with_file_filter(self):
        report = self.engine.analyze(SAMPLE_COMMITS, file_path="auth.py")
        # Only auth.py should be analyzed
        paths = [s.file_path for s in report.file_survivals]
        assert "auth.py" in paths
        assert "db.py" not in paths

    def test_analyze_heatmap(self):
        report = self.engine.analyze(SAMPLE_COMMITS)
        # Should have a heatmap for the most-changed file
        assert report.heatmap is not None
        assert report.heatmap.file_path != ""

    def test_analyze_empty_commits(self):
        report = self.engine.analyze([])
        assert report.commits_analyzed == 0
        assert report.files_analyzed == 0

    def test_report_to_dict(self):
        report = self.engine.analyze(SAMPLE_COMMITS)
        d = report.to_dict()
        assert "id" in d
        assert d["id"].startswith("cae-")
        assert "files_analyzed" in d
        assert "commits_analyzed" in d

    def test_query_why_question(self):
        self.engine.analyze(SAMPLE_COMMITS)
        result = self.engine.query("Why was auth.py changed?")
        assert "answer" in result
        assert "evidence" in result

    def test_query_when_question(self):
        result = self.engine.query("When was the auth module created?", commits=SAMPLE_COMMITS)
        assert "answer" in result

    def test_query_who_question(self):
        result = self.engine.query("Who contributed to this code?", commits=SAMPLE_COMMITS)
        assert "answer" in result
        assert "alice" in result["answer"] or "bob" in result["answer"]

    def test_query_frequency_question(self):
        result = self.engine.query("How often is auth.py changed?", commits=SAMPLE_COMMITS)
        assert "answer" in result

    def test_query_survival_question(self):
        self.engine.analyze(SAMPLE_COMMITS)
        result = self.engine.query("What is the most stable code?")
        assert "answer" in result

    def test_query_unknown_question(self):
        result = self.engine.query("What is the meaning of life?")
        assert "answer" in result

    def test_query_empty_commits(self):
        result = self.engine.query("Why was this changed?", commits=[])
        assert "answer" in result

    def test_get_stats(self):
        self.engine.analyze(SAMPLE_COMMITS)
        stats = self.engine.get_stats()
        assert "commits_cached" in stats
        assert "files_cached" in stats
        assert stats["commits_cached"] == 5

    def test_survival_rating_mature(self):
        # Commits from 30 days ago should be at least MATURE
        report = self.engine.analyze(SAMPLE_COMMITS)
        auth_survival = [s for s in report.file_survivals if s.file_path == "auth.py"]
        if auth_survival:
            assert auth_survival[0].survival_rating in (
                SurvivalRating.MATURE, SurvivalRating.ANCIENT, SurvivalRating.FOSSIL
            )

    def test_change_frequency(self):
        report = self.engine.analyze(SAMPLE_COMMITS)
        for s in report.file_survivals:
            assert s.change_frequency >= 0

    def test_intent_distribution_in_survival(self):
        report = self.engine.analyze(SAMPLE_COMMITS)
        auth_survival = [s for s in report.file_survivals if s.file_path == "auth.py"]
        if auth_survival:
            assert len(auth_survival[0].intent_distribution) > 0
