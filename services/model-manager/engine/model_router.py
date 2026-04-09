"""
Context-Aware Model Router (CAMR)

Intelligently selects the optimal model for each request based on:
- Task type (completion, chat, refactoring, testing)
- Code language and complexity
- Available VRAM
- User's personal model performance history

Priority: P1 Innovation
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)


class TaskType(Enum):
    """Classification of coding task types."""
    COMPLETION = "completion"
    CHAT = "chat"
    REFACTORING = "refactoring"
    TESTING = "testing"
    DEBUGGING = "debugging"
    DOCUMENTATION = "documentation"
    REVIEW = "review"
    UNKNOWN = "unknown"


class Complexity(Enum):
    """Code complexity levels."""
    SIMPLE = "simple"       # Single-line, trivial
    MODERATE = "moderate"  # Multi-line, standard patterns
    COMPLEX = "complex"     # Cross-file, architectural decisions


@dataclass
class ModelPerformance:
    """Performance record for a model on a specific task type."""
    model_id: str
    task_type: TaskType
    acceptance_count: int = 0
    rejection_count: int = 0
    total_latency_ms: float = 0.0
    total_requests: int = 0

    @property
    def acceptance_rate(self) -> float:
        if self.total_requests == 0:
            return 0.5  # Default: neutral
        return self.acceptance_count / self.total_requests

    @property
    def avg_latency_ms(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.total_latency_ms / self.total_requests

    def record(self, accepted: bool, latency_ms: float) -> None:
        """Record a completion result."""
        self.total_requests += 1
        self.total_latency_ms += latency_ms
        if accepted:
            self.acceptance_count += 1
        else:
            self.rejection_count += 1


@dataclass
class ModelCapabilities:
    """Static capabilities of a model."""
    model_id: str
    parameter_count_b: float       # Billions of parameters
    context_window: int            # Max context tokens
    vram_required_gb: float        # VRAM needed for inference
    supported_languages: List[str] = field(default_factory=lambda: ["*"])
    strengths: List[TaskType] = field(default_factory=list)
    quantization: str = "Q4_K_M"


# Default model capability profiles
DEFAULT_CAPABILITIES: Dict[str, ModelCapabilities] = {
    "qwen2.5-coder-7b": ModelCapabilities(
        model_id="qwen2.5-coder-7b",
        parameter_count_b=7,
        context_window=131072,
        vram_required_gb=6,
        strengths=[TaskType.COMPLETION, TaskType.CHAT],
        quantization="Q4_K_M",
    ),
    "qwen2.5-coder-32b": ModelCapabilities(
        model_id="qwen2.5-coder-32b",
        parameter_count_b=32,
        context_window=131072,
        vram_required_gb=24,
        strengths=[TaskType.REFACTORING, TaskType.DEBUGGING, TaskType.REVIEW],
        quantization="Q4_K_M",
    ),
    "deepseek-coder-33b": ModelCapabilities(
        model_id="deepseek-coder-33b",
        parameter_count_b=33,
        context_window=131072,
        vram_required_gb=26,
        strengths=[TaskType.REFACTORING, TaskType.DEBUGGING],
        quantization="Q4_K_M",
    ),
    "starcoder2-15b": ModelCapabilities(
        model_id="starcoder2-15b",
        parameter_count_b=15,
        context_window=8192,
        vram_required_gb=12,
        strengths=[TaskType.COMPLETION, TaskType.TESTING],
        quantization="Q4_K_M",
    ),
    "phi-4-coder-14b": ModelCapabilities(
        model_id="phi-4-coder-14b",
        parameter_count_b=14,
        context_window=16384,
        vram_required_gb=10,
        strengths=[TaskType.COMPLETION, TaskType.DOCUMENTATION],
        quantization="Q4_K_M",
    ),
}


class TaskClassifier:
    """Classifies the current coding task based on context signals."""

    # Keywords that signal different task types
    TASK_KEYWORDS: Dict[TaskType, List[str]] = {
        TaskType.COMPLETION: ["complete", "finish", "continue", "suggest", "autocomplete"],
        TaskType.CHAT: ["explain", "what", "how", "why", "tell me", "describe"],
        TaskType.REFACTORING: ["refactor", "rename", "extract", "move", "reorganize", "clean up"],
        TaskType.TESTING: ["test", "spec", "assert", "verify", "unit test", "integration test"],
        TaskType.DEBUGGING: ["bug", "error", "fix", "crash", "exception", "traceback", "debug"],
        TaskType.DOCUMENTATION: ["document", "comment", "docstring", "readme", "explain"],
        TaskType.REVIEW: ["review", "check", "audit", "lint", "improve", "optimize"],
    }

    @classmethod
    def classify(cls, prompt: str, context: str = "") -> TaskType:
        """Classify a prompt into a task type.

        Args:
            prompt: The user's prompt/query
            context: Optional surrounding code context

        Returns:
            The most likely TaskType
        """
        combined = (prompt + " " + context).lower()
        scores: Dict[TaskType, int] = {t: 0 for t in TaskType}

        for task_type, keywords in cls.TASK_KEYWORDS.items():
            for keyword in keywords:
                if keyword in combined:
                    scores[task_type] += 1

        if not any(scores.values()):
            return TaskType.UNKNOWN

        return max(scores, key=lambda t: scores[t])

    @classmethod
    def classify_complexity(cls, code: str) -> Complexity:
        """Estimate code complexity based on length and structure.

        Args:
            code: The code to analyze

        Returns:
            Estimated Complexity level
        """
        lines = code.strip().split("\n")
        line_count = len(lines)

        # Count structural indicators
        has_imports = any(line.startswith(("import ", "from ")) for line in lines)
        has_classes = any(line.startswith("class ") for line in lines)
        has_async = "async " in code
        has_nested = code.count("{") > 3 or code.count("def ") > 3

        complexity_score = 0
        if line_count > 20:
            complexity_score += 1
        if line_count > 50:
            complexity_score += 1
        if has_imports:
            complexity_score += 1
        if has_classes:
            complexity_score += 1
        if has_async:
            complexity_score += 1
        if has_nested:
            complexity_score += 1

        if complexity_score <= 1:
            return Complexity.SIMPLE
        elif complexity_score <= 3:
            return Complexity.MODERATE
        else:
            return Complexity.COMPLEX


class ModelRouter:
    """Context-Aware Model Router (CAMR)

    Intelligently selects the optimal model for each request based on:
    - Task type (completion, chat, refactoring, testing)
    - Code language and complexity
    - Available VRAM
    - User's personal model performance history

    Usage:
        router = ModelRouter()
        model_id = router.select_model(
            prompt="Fix the login bug",
            context="def login(user, pwd): ...",
            available_models=["qwen2.5-coder-7b", "qwen2.5-coder-32b"],
            available_vram_gb=24.0,
        )
    """

    def __init__(self) -> None:
        self.performance_history: Dict[str, Dict[TaskType, ModelPerformance]] = {}
        self.capabilities: Dict[str, ModelCapabilities] = dict(DEFAULT_CAPABILITIES)

    def select_model(
        self,
        prompt: str,
        context: str = "",
        available_models: Optional[List[str]] = None,
        available_vram_gb: Optional[float] = None,
        language: str = "python",
    ) -> str:
        """Select the best model for the given request.

        Args:
            prompt: The user's prompt/query
            context: Surrounding code context
            available_models: List of available model IDs (None = use all known)
            available_vram_gb: Available VRAM in GB (None = no constraint)
            language: Programming language of the code

        Returns:
            The recommended model_id
        """
        # Step 1: Classify the task
        task_type = TaskClassifier.classify(prompt, context)
        complexity = TaskClassifier.classify_complexity(context) if context else Complexity.MODERATE

        logger.info(f"CAMR: Classified task as {task_type.value}, complexity {complexity.value}")

        # Step 2: Filter to available models
        candidates = available_models or list(self.capabilities.keys())
        if not candidates:
            logger.warning("CAMR: No models available, returning default")
            return "qwen2.5-coder-7b"

        # Step 3: Filter by VRAM constraint
        if available_vram_gb is not None:
            vram_candidates = []
            for model_id in candidates:
                caps = self.capabilities.get(model_id)
                if caps and caps.vram_required_gb <= available_vram_gb:
                    vram_candidates.append(model_id)
                elif not caps:
                    # Unknown model — allow it (might be small)
                    vram_candidates.append(model_id)
            candidates = vram_candidates
            if not candidates:
                logger.warning("CAMR: No models fit in VRAM, falling back to smallest")
                # Fall back to smallest known model
                return "qwen2.5-coder-7b"

        # Step 4: Score each candidate
        scored: List[Tuple[str, float]] = []
        for model_id in candidates:
            score = self._score_model(model_id, task_type, complexity)
            scored.append((model_id, score))

        # Step 5: Select the best
        scored.sort(key=lambda x: x[1], reverse=True)
        best_model = scored[0][0]
        best_score = scored[0][1]

        logger.info(f"CAMR: Selected {best_model} (score={best_score:.2f}) for {task_type.value}/{complexity.value}")
        return best_model

    def _score_model(
        self,
        model_id: str,
        task_type: TaskType,
        complexity: Complexity,
    ) -> float:
        """Score a model for the given task type and complexity.

        Scoring factors:
        1. Task strength bonus (if model is known to be good at this task)
        2. Complexity match (larger models score higher for complex tasks)
        3. Performance history (learned from user acceptance data)
        4. Latency penalty (slower models score lower for simple tasks)
        """
        score = 50.0  # Base score

        caps = self.capabilities.get(model_id)
        if caps:
            # Task strength bonus
            if task_type in caps.strengths:
                score += 20.0

            # Complexity match
            if complexity == Complexity.COMPLEX and caps.parameter_count_b >= 14:
                score += 15.0
            elif complexity == Complexity.SIMPLE and caps.parameter_count_b <= 15:
                score += 10.0  # Prefer smaller models for simple tasks
            elif complexity == Complexity.MODERATE:
                score += 5.0

            # Context window bonus for complex tasks
            if complexity == Complexity.COMPLEX and caps.context_window >= 32768:
                score += 5.0

        # Performance history bonus
        perf = self.performance_history.get(model_id, {}).get(task_type)
        if perf and perf.total_requests >= 3:
            # Weighted acceptance rate (more data = more reliable)
            weight = min(perf.total_requests / 10.0, 1.0)
            score += perf.acceptance_rate * 20.0 * weight

            # Latency penalty for simple tasks
            if complexity == Complexity.SIMPLE and perf.avg_latency_ms > 2000:
                score -= 5.0

        # Unknown task type — slight preference for larger models
        if task_type == TaskType.UNKNOWN and caps:
            score += caps.parameter_count_b * 0.5

        return score

    def record_result(
        self,
        model_id: str,
        task_type: TaskType,
        accepted: bool,
        latency_ms: float,
    ) -> None:
        """Record a completion result for learning.

        Args:
            model_id: The model that was used
            task_type: The classified task type
            accepted: Whether the user accepted the completion
            latency_ms: Time to generate the completion
        """
        if model_id not in self.performance_history:
            self.performance_history[model_id] = {}

        if task_type not in self.performance_history[model_id]:
            self.performance_history[model_id][task_type] = ModelPerformance(
                model_id=model_id, task_type=task_type
            )

        self.performance_history[model_id][task_type].record(accepted, latency_ms)
        logger.info(
            f"CAMR: Recorded {model_id}/{task_type.value}: "
            f"accepted={accepted}, latency={latency_ms:.0f}ms"
        )

    def get_recommendations(
        self,
        available_models: List[str],
        available_vram_gb: float,
    ) -> Dict[str, str]:
        """Get model recommendations for each task type.

        Returns:
            Dict mapping task type to recommended model_id
        """
        recommendations = {}
        for task_type in TaskType:
            if task_type == TaskType.UNKNOWN:
                continue
            model = self.select_model(
                prompt="",  # Empty prompt for general recommendation
                available_models=available_models,
                available_vram_gb=available_vram_gb,
            )
            recommendations[task_type.value] = model
        return recommendations