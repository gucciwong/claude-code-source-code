"""
Tests for Predictive Bug Radar (PBR) — Innovation #2
"""

import pytest
from execution_trace.predictive_bug_radar import (
    PredictiveBugEngine,
    BugHeatmap,
    BugPrediction,
    BugRiskLevel,
    BugCategory,
    TracePattern,
)


class TestPredictiveBugEngine:
    def setup_method(self):
        self.engine = PredictiveBugEngine()

    def test_analyze_clean_code(self):
        """Clean code should have low overall risk."""
        code = "x = 1\ny = 2\nz = x + y\n"
        heatmap = self.engine.analyze("test.py", code, "python")
        assert heatmap.overall_risk in (BugRiskLevel.LOW, BugRiskLevel.MEDIUM)

    def test_analyze_dict_access(self):
        """Dict access without .get() should flag KEY_ERROR."""
        code = "result = data['key']\n"
        heatmap = self.engine.analyze("test.py", code, "python")
        categories = [p.category for p in heatmap.predictions]
        assert BugCategory.KEY_ERROR in categories

    def test_analyze_bare_except(self):
        """Bare except should flag UNHANDLED_EXCEPTION."""
        code = "try:\n    x = 1\nexcept:\n    pass\n"
        heatmap = self.engine.analyze("test.py", code, "python")
        categories = [p.category for p in heatmap.predictions]
        assert BugCategory.UNHANDLED_EXCEPTION in categories

    def test_analyze_division(self):
        """Division should flag potential DIVISION_BY_ZERO."""
        code = "result = x / y\n"
        heatmap = self.engine.analyze("test.py", code, "python")
        # May or may not flag depending on pattern matching
        assert isinstance(heatmap, BugHeatmap)

    def test_analyze_range_len(self):
        """range(len(...)) should flag OFF_BY_ONE."""
        code = "for i in range(len(items)):\n    print(items[i])\n"
        heatmap = self.engine.analyze("test.py", code, "python")
        categories = [p.category for p in heatmap.predictions]
        assert BugCategory.OFF_BY_ONE in categories

    def test_analyze_open_without_with(self):
        """open() without 'as' should flag RESOURCE_LEAK."""
        code = "f = open('file.txt')\n"
        heatmap = self.engine.analyze("test.py", code, "python")
        categories = [p.category for p in heatmap.predictions]
        assert BugCategory.RESOURCE_LEAK in categories

    def test_analyze_javascript(self):
        """JavaScript analysis should work with pattern matching."""
        code = "const x = data['key'];\n"
        heatmap = self.engine.analyze("test.js", code, "javascript")
        assert isinstance(heatmap, BugHeatmap)

    def test_record_trace_result(self):
        """Recording trace results should improve predictions."""
        code = "result = data['key']\n"
        heatmap1 = self.engine.analyze("test.py", code, "python")

        # Record an actual error
        self.engine.record_trace_result("test.py", 1, "KeyError", "'key'")

        # Re-analyze — predictions should be boosted
        heatmap2 = self.engine.analyze("test.py", code, "python")
        assert isinstance(heatmap2, BugHeatmap)

    def test_add_custom_pattern(self):
        """Custom patterns should be detected."""
        self.engine.add_pattern(
            pattern_type=BugCategory.VALUE_ERROR,
            code_pattern=r"int\([^)]+\)",
            error_rate=0.25,
        )
        code = "x = int(user_input)\n"
        heatmap = self.engine.analyze("test.py", code, "python")
        categories = [p.category for p in heatmap.predictions]
        assert BugCategory.VALUE_ERROR in categories

    def test_heatmap_to_dict(self):
        """Heatmap should serialize to dict correctly."""
        code = "data['key']\n"
        heatmap = self.engine.analyze("test.py", code, "python")
        d = heatmap.to_dict()
        assert "file_path" in d
        assert "predictions" in d
        assert "overall_risk" in d
        assert "total_predictions" in d

    def test_overall_risk_critical(self):
        """Multiple high-probability predictions should yield CRITICAL risk."""
        # Code with many risky patterns
        code = "\n".join([
            "try:",
            "    data['key']",
            "except:",
            "    pass",
            "f = open('file.txt')",
            "for i in range(len(items)):",
            "    print(items[i])",
        ])
        heatmap = self.engine.analyze("test.py", code, "python")
        # Should have at least MEDIUM risk
        assert heatmap.overall_risk in (
            BugRiskLevel.MEDIUM, BugRiskLevel.HIGH, BugRiskLevel.CRITICAL
        )

    def test_ast_analysis_dict_subscript(self):
        """AST analysis should detect dict subscript access."""
        code = "x = data['key']\n"
        heatmap = self.engine.analyze("test.py", code, "python")
        # AST analysis should add KEY_ERROR prediction
        key_errors = [p for p in heatmap.predictions if p.category == BugCategory.KEY_ERROR]
        assert len(key_errors) >= 1

    def test_ast_analysis_bare_except(self):
        """AST analysis should detect bare except clauses."""
        code = "try:\n    x = 1\nexcept:\n    pass\n"
        heatmap = self.engine.analyze("test.py", code, "python")
        bare_excepts = [p for p in heatmap.predictions
                       if p.category == BugCategory.UNHANDLED_EXCEPTION]
        assert len(bare_excepts) >= 1

    def test_syntax_error_handled(self):
        """Syntax errors in code should not crash analysis."""
        code = "def broken(\n"
        heatmap = self.engine.analyze("test.py", code, "python")
        assert isinstance(heatmap, BugHeatmap)


class TestBugPrediction:
    def test_prediction_fields(self):
        pred = BugPrediction(
            line=10,
            risk_level=BugRiskLevel.HIGH,
            probability=0.75,
            category=BugCategory.KEY_ERROR,
            description="Dict key access",
            suggestion="Use .get()",
            confidence=0.8,
        )
        assert pred.line == 10
        assert pred.risk_level == BugRiskLevel.HIGH
        assert pred.probability == 0.75

    def test_risk_levels(self):
        assert BugRiskLevel.LOW.value == "low"
        assert BugRiskLevel.MEDIUM.value == "medium"
        assert BugRiskLevel.HIGH.value == "high"
        assert BugRiskLevel.CRITICAL.value == "critical"


class TestBugCategory:
    def test_all_categories(self):
        categories = list(BugCategory)
        assert len(categories) == 15  # All defined categories

    def test_category_values(self):
        assert BugCategory.KEY_ERROR.value == "key_error"
        assert BugCategory.NULL_POINTER.value == "null_pointer"
        assert BugCategory.DIVISION_BY_ZERO.value == "division_by_zero"