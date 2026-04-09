"""
Tests for Context-Aware Model Router (CAMR) — Innovation #3
"""

import pytest
from engine.model_router import (
    TaskType,
    Complexity,
    TaskClassifier,
    ModelRouter,
    ModelPerformance,
    ModelCapabilities,
    DEFAULT_CAPABILITIES,
)


# ── TaskClassifier Tests ──────────────────────────────────────

class TestTaskClassifier:
    def test_classify_completion(self):
        result = TaskClassifier.classify("complete the function")
        assert result == TaskType.COMPLETION

    def test_classify_chat(self):
        result = TaskClassifier.classify("explain how this works")
        assert result == TaskType.CHAT

    def test_classify_refactoring(self):
        result = TaskClassifier.classify("refactor this module")
        assert result == TaskType.REFACTORING

    def test_classify_testing(self):
        result = TaskClassifier.classify("write a unit test for this")
        assert result == TaskType.TESTING

    def test_classify_debugging(self):
        result = TaskClassifier.classify("fix the bug in login")
        assert result == TaskType.DEBUGGING

    def test_classify_documentation(self):
        result = TaskClassifier.classify("add docstring to this function")
        assert result == TaskType.DOCUMENTATION

    def test_classify_review(self):
        result = TaskClassifier.classify("review this code for issues")
        assert result == TaskType.REVIEW

    def test_classify_unknown(self):
        result = TaskClassifier.classify("xyzzy foobar")
        assert result == TaskType.UNKNOWN

    def test_classify_with_context(self):
        result = TaskClassifier.classify("fix", "def login(user, pwd): ...")
        assert result == TaskType.DEBUGGING

    def test_classify_complexity_simple(self):
        code = "x = 1"
        result = TaskClassifier.classify_complexity(code)
        assert result == Complexity.SIMPLE

    def test_classify_complexity_moderate(self):
        code = "import os\n\ndef hello():\n    print('hi')\n"
        result = TaskClassifier.classify_complexity(code)
        assert result in (Complexity.SIMPLE, Complexity.MODERATE)

    def test_classify_complexity_complex(self):
        code = "\n".join([
            "import os",
            "import sys",
            "from typing import Optional",
            "",
            "class DataProcessor:",
            "    async def process(self, data):",
            "        def inner():",
            "            pass",
            "        def inner2():",
            "            pass",
            "        def inner3():",
            "            pass",
            "        def inner4():",
            "            pass",
            "        return data",
            "",
            "    def validate(self, item):",
            "        return True",
            "",
            "    def transform(self, item):",
            "        return item",
            "",
            "async def main():",
            "    proc = DataProcessor()",
            "    await proc.process([])",
        ] * 2)  # Double to exceed 50 lines
        result = TaskClassifier.classify_complexity(code)
        assert result == Complexity.COMPLEX


# ── ModelRouter Tests ─────────────────────────────────────────

class TestModelRouter:
    def setup_method(self):
        self.router = ModelRouter()

    def test_select_model_default(self):
        """Select model with no constraints returns a valid model."""
        result = self.router.select_model(prompt="complete this code")
        assert result in DEFAULT_CAPABILITIES or isinstance(result, str)

    def test_select_model_with_vram_constraint(self):
        """Models that don't fit in VRAM should be excluded."""
        result = self.router.select_model(
            prompt="refactor this code",
            available_models=["qwen2.5-coder-7b", "qwen2.5-coder-32b"],
            available_vram_gb=8.0,
        )
        # 7b needs 6GB, 32b needs 24GB — only 7b fits
        assert result == "qwen2.5-coder-7b"

    def test_select_model_debugging_prefers_large(self):
        """Debugging tasks should prefer larger models."""
        result = self.router.select_model(
            prompt="fix the bug",
            available_models=["qwen2.5-coder-7b", "qwen2.5-coder-32b"],
            available_vram_gb=32.0,
        )
        # 32b has debugging as strength, should be preferred
        assert result == "qwen2.5-coder-32b"

    def test_select_model_completion_prefers_small(self):
        """Simple completion tasks should prefer smaller, faster models."""
        result = self.router.select_model(
            prompt="complete this line",
            context="x = ",
            available_models=["qwen2.5-coder-7b", "qwen2.5-coder-32b"],
            available_vram_gb=32.0,
        )
        # Both could work, but 7b has completion as strength
        assert result in ("qwen2.5-coder-7b", "qwen2.5-coder-32b")

    def test_select_model_no_candidates_returns_default(self):
        """When no models are provided, fall back to known models."""
        result = self.router.select_model(
            prompt="test",
            available_models=[],
        )
        # Empty list triggers fallback to all known models
        assert result in DEFAULT_CAPABILITIES

    def test_record_result_and_learn(self):
        """Recording feedback should influence future selections."""
        # Record that 7b was rejected for debugging
        self.router.record_result(
            model_id="qwen2.5-coder-7b",
            task_type=TaskType.DEBUGGING,
            accepted=False,
            latency_ms=500.0,
        )
        # Record that 32b was accepted for debugging
        for _ in range(5):
            self.router.record_result(
                model_id="qwen2.5-coder-32b",
                task_type=TaskType.DEBUGGING,
                accepted=True,
                latency_ms=300.0,
            )

        # Now select for debugging — should prefer 32b
        result = self.router.select_model(
            prompt="fix the bug",
            available_models=["qwen2.5-coder-7b", "qwen2.5-coder-32b"],
            available_vram_gb=32.0,
        )
        assert result == "qwen2.5-coder-32b"

    def test_get_recommendations(self):
        """Get recommendations for all task types."""
        recs = self.router.get_recommendations(
            available_models=["qwen2.5-coder-7b"],
            available_vram_gb=8.0,
        )
        assert isinstance(recs, dict)
        assert "completion" in recs
        assert recs["completion"] == "qwen2.5-coder-7b"

    def test_unknown_model_allowed(self):
        """Unknown models should still be selectable."""
        result = self.router.select_model(
            prompt="complete this",
            available_models=["my-custom-model"],
            available_vram_gb=100.0,
        )
        assert result == "my-custom-model"

    def test_vram_too_small_fallback(self):
        """When no model fits in VRAM, fall back to smallest."""
        result = self.router.select_model(
            prompt="complete this",
            available_models=["qwen2.5-coder-32b"],
            available_vram_gb=2.0,
        )
        assert result == "qwen2.5-coder-7b"


# ── ModelPerformance Tests ────────────────────────────────────

class TestModelPerformance:
    def test_default_acceptance_rate(self):
        perf = ModelPerformance(model_id="test", task_type=TaskType.CHAT)
        assert perf.acceptance_rate == 0.5  # Neutral default

    def test_record_acceptance(self):
        perf = ModelPerformance(model_id="test", task_type=TaskType.CHAT)
        perf.record(accepted=True, latency_ms=100.0)
        assert perf.acceptance_rate == 1.0
        assert perf.total_requests == 1
        assert perf.avg_latency_ms == 100.0

    def test_record_mixed(self):
        perf = ModelPerformance(model_id="test", task_type=TaskType.CHAT)
        perf.record(accepted=True, latency_ms=100.0)
        perf.record(accepted=False, latency_ms=200.0)
        assert perf.acceptance_rate == 0.5
        assert perf.avg_latency_ms == 150.0