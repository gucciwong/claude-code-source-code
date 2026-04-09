"""
Code Archaeology Engine (CAE) — Innovation #10

Analyzes git history to infer the intent behind code changes, measure code
survival rates, and produce decision-density heatmaps. Helps developers
understand *why* code exists, not just *what* it does.

Priority: P2 | Service: execution-trace-service (port 8005)
"""

from __future__ import annotations

import re
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, List, Tuple
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class ChangeIntent(Enum):
    """Inferred intent behind a code change."""
    FEATURE = "feature"
    BUGFIX = "bugfix"
    REFACTOR = "refactor"
    PERF = "perf"
    SECURITY = "security"
    DOCS = "docs"
    TEST = "test"
    STYLE = "style"
    CHORE = "chore"
    UNKNOWN = "unknown"


class SurvivalRating(Enum):
    """How long code has survived without modification."""
    INFANT = "infant"       # < 7 days
    YOUNG = "young"         # 7-30 days
    MATURE = "mature"       # 30-180 days
    ANCIENT = "ancient"     # 180+ days
    FOSSIL = "fossil"       # 365+ days


@dataclass
class CommitInfo:
    """Parsed information from a git commit."""
    hash: str
    message: str
    author: str = ""
    timestamp: float = 0.0
    files_changed: List[str] = field(default_factory=list)
    insertions: int = 0
    deletions: int = 0
    intent: ChangeIntent = ChangeIntent.UNKNOWN

    def to_dict(self) -> dict:
        return {
            "hash": self.hash[:8],
            "message": self.message[:100],
            "author": self.author,
            "timestamp": self.timestamp,
            "files_changed": len(self.files_changed),
            "insertions": self.insertions,
            "deletions": self.deletions,
            "intent": self.intent.value,
        }


@dataclass
class FileSurvival:
    """Survival analysis for a file."""
    file_path: str
    first_commit: float = 0.0
    last_modified: float = 0.0
    total_commits: int = 0
    survival_rating: SurvivalRating = SurvivalRating.INFANT
    change_frequency: float = 0.0  # changes per week
    intent_distribution: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "file_path": self.file_path,
            "survival_rating": self.survival_rating.value,
            "total_commits": self.total_commits,
            "change_frequency": round(self.change_frequency, 2),
            "intent_distribution": self.intent_distribution,
        }


@dataclass
class DecisionHeatmap:
    """Decision density heatmap for a codebase region."""
    file_path: str
    total_decisions: int = 0
    decision_density: float = 0.0  # decisions per line
    hotspots: List[Dict] = field(default_factory=list)
    intent_breakdown: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "file_path": self.file_path,
            "total_decisions": self.total_decisions,
            "decision_density": round(self.decision_density, 4),
            "hotspots": self.hotspots[:10],
            "intent_breakdown": self.intent_breakdown,
        }


@dataclass
class ArchaeologyReport:
    """Full archaeology report for a codebase or file."""
    id: str
    files_analyzed: int = 0
    commits_analyzed: int = 0
    survival_stats: Dict[str, int] = field(default_factory=dict)
    intent_distribution: Dict[str, int] = field(default_factory=dict)
    heatmap: Optional[DecisionHeatmap] = None
    file_survivals: List[FileSurvival] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "files_analyzed": self.files_analyzed,
            "commits_analyzed": self.commits_analyzed,
            "survival_stats": self.survival_stats,
            "intent_distribution": self.intent_distribution,
            "heatmap": self.heatmap.to_dict() if self.heatmap else None,
            "file_survivals": [f.to_dict() for f in self.file_survivals[:20]],
            "created_at": self.created_at,
        }


class IntentInferrer:
    """Infers the intent behind a commit from its message and changes.

    Uses keyword matching and heuristics to classify commits.
    """

    INTENT_KEYWORDS: Dict[ChangeIntent, List[str]] = {
        ChangeIntent.FEATURE: ["add", "create", "implement", "new", "feature", "support", "introduce"],
        ChangeIntent.BUGFIX: ["fix", "bug", "patch", "resolve", "repair", "correct", "issue"],
        ChangeIntent.REFACTOR: ["refactor", "rename", "extract", "move", "reorganize", "clean", "simplify"],
        ChangeIntent.PERF: ["perf", "optimize", "speed", "fast", "slow", "memory", "cache", "bottleneck"],
        ChangeIntent.SECURITY: ["security", "vuln", "cve", "xss", "injection", "auth", "sanitize"],
        ChangeIntent.DOCS: ["doc", "readme", "comment", "guide", "tutorial", "changelog"],
        ChangeIntent.TEST: ["test", "spec", "assert", "coverage", "mock", "fixture"],
        ChangeIntent.STYLE: ["style", "format", "lint", "whitespace", "indent", "prettier"],
        ChangeIntent.CHORE: ["chore", "build", "ci", "deploy", "config", "deps", "dependabot", "bump"],
    }

    def infer(self, commit_message: str, files_changed: List[str] = None) -> ChangeIntent:
        """Infer the intent of a commit from its message.

        Args:
            commit_message: The commit message text
            files_changed: List of files changed (optional context)

        Returns:
            Inferred ChangeIntent
        """
        msg_lower = commit_message.lower()
        scores: Dict[ChangeIntent, int] = {intent: 0 for intent in ChangeIntent}

        for intent, keywords in self.INTENT_KEYWORDS.items():
            for kw in keywords:
                if kw in msg_lower:
                    scores[intent] += 2

        # File-based heuristics
        if files_changed:
            for f in files_changed:
                f_lower = f.lower()
                if "test" in f_lower or f_lower.startswith("test"):
                    scores[ChangeIntent.TEST] += 1
                if "doc" in f_lower or "readme" in f_lower:
                    scores[ChangeIntent.DOCS] += 1
                if ".css" in f_lower or ".scss" in f_lower:
                    scores[ChangeIntent.STYLE] += 1
                if "docker" in f_lower or "ci" in f_lower or ".yml" in f_lower:
                    scores[ChangeIntent.CHORE] += 1

        if not any(scores.values()):
            return ChangeIntent.UNKNOWN

        return max(scores, key=lambda i: scores[i])


class CodeArchaeologyEngine:
    """Main engine for code archaeology analysis.

    Analyzes git history to:
    1. Infer intent behind code changes
    2. Measure code survival rates
    3. Produce decision-density heatmaps
    4. Answer natural-language queries about code history

    Usage:
        engine = CodeArchaeologyEngine()
        report = engine.analyze(commits=[...])
    """

    def __init__(self) -> None:
        self.intent_inferrer = IntentInferrer()
        self._commit_cache: Dict[str, CommitInfo] = {}
        self._survival_cache: Dict[str, FileSurvival] = {}

    def analyze(
        self,
        commits: List[Dict],
        file_path: Optional[str] = None,
    ) -> ArchaeologyReport:
        """Analyze a list of commits to produce an archaeology report.

        Args:
            commits: List of commit dicts with keys: hash, message, author,
                     timestamp, files_changed, insertions, deletions
            file_path: Optional specific file to focus analysis on

        Returns:
            ArchaeologyReport with survival stats, intent distribution, heatmap
        """
        report_id = f"cae-{uuid.uuid4().hex[:8]}"

        # Parse and infer intent for each commit
        parsed_commits = []
        for c in commits:
            commit = CommitInfo(
                hash=c.get("hash", ""),
                message=c.get("message", ""),
                author=c.get("author", ""),
                timestamp=c.get("timestamp", 0.0),
                files_changed=c.get("files_changed", []),
                insertions=c.get("insertions", 0),
                deletions=c.get("deletions", 0),
            )
            commit.intent = self.intent_inferrer.infer(
                commit.message, commit.files_changed
            )
            parsed_commits.append(commit)
            self._commit_cache[commit.hash] = commit

        # Build file survival data
        file_commits: Dict[str, List[CommitInfo]] = defaultdict(list)
        for commit in parsed_commits:
            for f in commit.files_changed:
                if file_path and f != file_path:
                    continue
                file_commits[f].append(commit)

        file_survivals = []
        for fp, f_commits in file_commits.items():
            survival = self._compute_survival(fp, f_commits)
            file_survivals.append(survival)
            self._survival_cache[fp] = survival

        # Compute survival stats
        survival_stats: Dict[str, int] = defaultdict(int)
        for s in file_survivals:
            survival_stats[s.survival_rating.value] += 1

        # Compute intent distribution
        intent_dist: Dict[str, int] = defaultdict(int)
        for commit in parsed_commits:
            intent_dist[commit.intent.value] += 1

        # Build heatmap for specific file or overall
        heatmap = None
        if file_path and file_path in file_commits:
            heatmap = self._build_heatmap(file_path, file_commits[file_path])
        elif file_survivals:
            # Build heatmap for the most-changed file
            most_changed = max(file_survivals, key=lambda s: s.total_commits)
            if most_changed.file_path in file_commits:
                heatmap = self._build_heatmap(
                    most_changed.file_path,
                    file_commits[most_changed.file_path],
                )

        return ArchaeologyReport(
            id=report_id,
            files_analyzed=len(file_survivals),
            commits_analyzed=len(parsed_commits),
            survival_stats=dict(survival_stats),
            intent_distribution=dict(intent_dist),
            heatmap=heatmap,
            file_survivals=file_survivals,
        )

    def query(self, question: str, commits: List[Dict] = None) -> Dict:
        """Answer a natural-language question about code history.

        Args:
            question: Natural language question
            commits: Optional commits to analyze (uses cache if not provided)

        Returns:
            Dict with answer and supporting evidence
        """
        q_lower = question.lower()

        # Pattern-match common question types
        if any(w in q_lower for w in ["why", "reason", "intent", "purpose"]):
            return self._answer_why_question(question, commits or [])
        elif any(w in q_lower for w in ["when", "date", "time", "history"]):
            return self._answer_when_question(question, commits or [])
        elif any(w in q_lower for w in ["who", "author", "wrote", "contributor"]):
            return self._answer_who_question(question, commits or [])
        elif any(w in q_lower for w in ["how often", "frequency", "often", "rate"]):
            return self._answer_frequency_question(question, commits or [])
        elif any(w in q_lower for w in ["stable", "survival", "old", "mature", "ancient"]):
            return self._answer_survival_question(question, commits or [])
        else:
            return {
                "question": question,
                "answer": "I couldn't determine the intent of your question. Try asking about why, when, who, how often, or stability of code changes.",
                "evidence": [],
            }

    def get_stats(self) -> dict:
        """Get engine statistics."""
        return {
            "commits_cached": len(self._commit_cache),
            "files_cached": len(self._survival_cache),
        }

    def _compute_survival(
        self,
        file_path: str,
        commits: List[CommitInfo],
    ) -> FileSurvival:
        """Compute survival analysis for a file."""
        if not commits:
            return FileSurvival(file_path=file_path)

        sorted_commits = sorted(commits, key=lambda c: c.timestamp)
        first_commit = sorted_commits[0].timestamp
        last_modified = sorted_commits[-1].timestamp
        total_commits = len(commits)

        # Compute survival rating
        now = time.time()
        age_days = (now - first_commit) / 86400

        if age_days >= 365:
            rating = SurvivalRating.FOSSIL
        elif age_days >= 180:
            rating = SurvivalRating.ANCIENT
        elif age_days >= 30:
            rating = SurvivalRating.MATURE
        elif age_days >= 7:
            rating = SurvivalRating.YOUNG
        else:
            rating = SurvivalRating.INFANT

        # Compute change frequency (changes per week)
        age_weeks = max(age_days / 7, 0.01)
        change_frequency = total_commits / age_weeks

        # Compute intent distribution
        intent_dist: Dict[str, int] = defaultdict(int)
        for c in commits:
            intent_dist[c.intent.value] += 1

        return FileSurvival(
            file_path=file_path,
            first_commit=first_commit,
            last_modified=last_modified,
            total_commits=total_commits,
            survival_rating=rating,
            change_frequency=change_frequency,
            intent_distribution=dict(intent_dist),
        )

    def _build_heatmap(
        self,
        file_path: str,
        commits: List[CommitInfo],
    ) -> DecisionHeatmap:
        """Build a decision-density heatmap for a file."""
        total_decisions = len(commits)
        # Approximate line count from insertions
        total_lines = sum(c.insertions for c in commits) or 1
        decision_density = total_decisions / total_lines

        # Build hotspots from commits
        hotspots = []
        for c in sorted(commits, key=lambda c: c.insertions + c.deletions, reverse=True)[:10]:
            hotspots.append({
                "commit": c.hash[:8],
                "intent": c.intent.value,
                "changes": c.insertions + c.deletions,
                "message": c.message[:80],
            })

        # Intent breakdown
        intent_breakdown: Dict[str, int] = defaultdict(int)
        for c in commits:
            intent_breakdown[c.intent.value] += 1

        return DecisionHeatmap(
            file_path=file_path,
            total_decisions=total_decisions,
            decision_density=decision_density,
            hotspots=hotspots,
            intent_breakdown=dict(intent_breakdown),
        )

    def _answer_why_question(self, question: str, commits: List[Dict]) -> Dict:
        """Answer a 'why' question about code changes."""
        parsed = self._parse_commits(commits)
        if not parsed:
            return {"question": question, "answer": "No commits available to analyze.", "evidence": []}

        # Find the most common intent
        intent_counts: Dict[ChangeIntent, int] = defaultdict(int)
        for c in parsed:
            intent_counts[c.intent] += 1

        top_intent = max(intent_counts, key=lambda i: intent_counts[i])
        top_commits = [c for c in parsed if c.intent == top_intent][:3]

        return {
            "question": question,
            "answer": f"The primary reason for changes was {top_intent.value} ({intent_counts[top_intent]} commits).",
            "evidence": [c.to_dict() for c in top_commits],
        }

    def _answer_when_question(self, question: str, commits: List[Dict]) -> Dict:
        """Answer a 'when' question about code changes."""
        parsed = self._parse_commits(commits)
        if not parsed:
            return {"question": question, "answer": "No commits available to analyze.", "evidence": []}

        sorted_commits = sorted(parsed, key=lambda c: c.timestamp)
        first = sorted_commits[0]
        last = sorted_commits[-1]

        return {
            "question": question,
            "answer": f"Changes span from {time.strftime('%Y-%m-%d', time.localtime(first.timestamp))} to {time.strftime('%Y-%m-%d', time.localtime(last.timestamp))}.",
            "evidence": [first.to_dict(), last.to_dict()],
        }

    def _answer_who_question(self, question: str, commits: List[Dict]) -> Dict:
        """Answer a 'who' question about code changes."""
        parsed = self._parse_commits(commits)
        if not parsed:
            return {"question": question, "answer": "No commits available to analyze.", "evidence": []}

        author_counts: Dict[str, int] = defaultdict(int)
        for c in parsed:
            if c.author:
                author_counts[c.author] += 1

        if not author_counts:
            return {"question": question, "answer": "No author information available.", "evidence": []}

        top_author = max(author_counts, key=lambda a: author_counts[a])

        return {
            "question": question,
            "answer": f"Top contributor: {top_author} ({author_counts[top_author]} commits).",
            "evidence": [{"author": a, "commits": c} for a, c in sorted(author_counts.items(), key=lambda x: -x[1])[:5]],
        }

    def _answer_frequency_question(self, question: str, commits: List[Dict]) -> Dict:
        """Answer a 'how often' question about code changes."""
        parsed = self._parse_commits(commits)
        if not parsed:
            return {"question": question, "answer": "No commits available to analyze.", "evidence": []}

        if len(parsed) < 2:
            return {"question": question, "answer": "Not enough commits to determine frequency.", "evidence": []}

        sorted_commits = sorted(parsed, key=lambda c: c.timestamp)
        span_days = (sorted_commits[-1].timestamp - sorted_commits[0].timestamp) / 86400
        span_days = max(span_days, 0.01)
        commits_per_week = len(parsed) / (span_days / 7)

        return {
            "question": question,
            "answer": f"Change frequency: {commits_per_week:.1f} commits/week over {span_days:.0f} days.",
            "evidence": [{"total_commits": len(parsed), "span_days": round(span_days, 1)}],
        }

    def _answer_survival_question(self, question: str, commits: List[Dict]) -> Dict:
        """Answer a question about code stability/survival."""
        if self._survival_cache:
            # Use cached survival data
            stable_files = [
                s for s in self._survival_cache.values()
                if s.survival_rating in (SurvivalRating.ANCIENT, SurvivalRating.FOSSIL)
            ]
            if stable_files:
                top = sorted(stable_files, key=lambda s: s.total_commits, reverse=True)[:3]
                return {
                    "question": question,
                    "answer": f"Most stable files: {', '.join(s.file_path for s in top)}.",
                    "evidence": [s.to_dict() for s in top],
                }

        return {
            "question": question,
            "answer": "Run an analysis first to get survival data.",
            "evidence": [],
        }

    def _parse_commits(self, commits: List[Dict]) -> List[CommitInfo]:
        """Parse raw commit dicts into CommitInfo objects."""
        result = []
        for c in commits:
            commit = CommitInfo(
                hash=c.get("hash", ""),
                message=c.get("message", ""),
                author=c.get("author", ""),
                timestamp=c.get("timestamp", 0.0),
                files_changed=c.get("files_changed", []),
                insertions=c.get("insertions", 0),
                deletions=c.get("deletions", 0),
            )
            commit.intent = self.intent_inferrer.infer(
                commit.message, commit.files_changed
            )
            result.append(commit)
        return result
