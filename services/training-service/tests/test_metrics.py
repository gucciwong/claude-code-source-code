"""
TDD Tests for Metric Calculation Functions — Phase 2.3

Run: cd services/training-service && python -m pytest tests/test_metrics.py -v

Key test coverage:
1. val_loss: computes correctly on mock data
2. val_bpb: formula is correct (loss / ln(2))
3. val_bpb: deterministic (same loss → same bpb across runs)
4. humaneval_pass1: returns float 0.0-1.0
5. code_quality_score: returns float 0.0-1.0
6. MetricCalculator.compute_all: computes requested metrics
7. Metric immutability: same inputs → same outputs (no randomness)
"""

import pytest
import sys
import os
import math
import tempfile
import json
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, List

# Ensure training-service root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from evaluation.metrics import (
    val_loss,
    val_bpb,
    humaneval_pass1,
    code_quality_score,
    MetricCalculator,
    METRIC_CONFIG,
    DEFAULT_PRIMARY_METRIC,
)
from evaluation.data import ValidationDataset


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mock_validation_dataset():
    """Fixture: Mock validation dataset."""
    mock_ds = MagicMock(spec=ValidationDataset)
    mock_ds.examples = [
        {"text": "def hello(): return 'world'", "label": 0},
        {"text": "def add(a, b): return a + b", "label": 1},
        {"text": "def multiply(x, y): return x * y", "label": 0},
    ]
    return mock_ds


@pytest.fixture
def temp_checkpoint_path(tmp_path):
    """Fixture: Temporary model checkpoint path."""
    checkpoint_dir = tmp_path / "model_checkpoint"
    checkpoint_dir.mkdir()
    # Create a dummy model file
    (checkpoint_dir / "pytorch_model.bin").write_text("dummy model")
    return checkpoint_dir


# ============================================================================
# Tests for val_loss()
# ============================================================================

class TestValLoss:
    """Test suite for val_loss() function."""

    def test_val_loss_returns_float(self, mock_validation_dataset):
        """Test: val_loss returns a float scalar."""
        model_output = {
            "logits": [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]],
        }
        labels = [0, 1]
        
        result = val_loss(model_output, labels)
        
        assert isinstance(result, float)

    def test_val_loss_non_negative(self, mock_validation_dataset):
        """Test: val_loss is always non-negative (cross-entropy property)."""
        model_output = {
            "logits": [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]],
        }
        labels = [0, 1]
        
        result = val_loss(model_output, labels)
        
        assert result >= 0.0, "Cross-entropy loss must be non-negative"

    def test_val_loss_perfect_predictions_low_loss(self):
        """Test: Perfect predictions have lower loss."""
        import torch
        
        # Very confident correct predictions
        model_output = {
            "logits": [[100.0, -100.0], [-100.0, 100.0]],
        }
        labels = [0, 1]
        
        result = val_loss(model_output, labels)
        
        assert result < 1.0, "Perfect predictions should have low loss"

    def test_val_loss_deterministic(self):
        """Test: Same inputs → same loss (no randomness)."""
        model_output = {
            "logits": [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]],
        }
        labels = [0, 1]
        
        result1 = val_loss(model_output, labels)
        result2 = val_loss(model_output, labels)
        
        assert result1 == result2, "val_loss must be deterministic"

    def test_val_loss_handles_batch(self):
        """Test: val_loss handles multiple examples correctly."""
        model_output = {
            "logits": [
                [1.0, 2.0, 3.0],
                [4.0, 5.0, 6.0],
                [7.0, 8.0, 9.0],
            ]
        }
        labels = [0, 1, 2]
        
        result = val_loss(model_output, labels)
        
        assert isinstance(result, float)
        assert not math.isnan(result), "Loss should not be NaN"


# ============================================================================
# Tests for val_bpb()
# ============================================================================

class TestValBpb:
    """Test suite for val_bpb() function."""

    def test_val_bpb_returns_float(self):
        """Test: val_bpb returns a float scalar."""
        loss = 2.5
        result = val_bpb(loss)
        
        assert isinstance(result, float)

    def test_val_bpb_formula_correct(self):
        """Test: val_bpb formula is correct (loss / ln(2))."""
        loss = 1.0
        expected = 1.0 / math.log(2)
        
        result = val_bpb(loss)
        
        assert abs(result - expected) < 1e-10, "val_bpb formula incorrect"

    def test_val_bpb_known_value(self):
        """Test: val_bpb(1.0) ≈ 1.443."""
        loss = 1.0
        result = val_bpb(loss)
        
        # 1.0 / ln(2) ≈ 1.4426950408...
        assert abs(result - 1.4426950408) < 0.001

    def test_val_bpb_deterministic(self):
        """Test: Same loss → same bpb across runs (no randomness)."""
        loss = 2.5
        
        result1 = val_bpb(loss)
        result2 = val_bpb(loss)
        result3 = val_bpb(loss)
        
        assert result1 == result2 == result3, "val_bpb must be deterministic"

    def test_val_bpb_zero_loss(self):
        """Test: val_bpb(0.0) = 0.0 (perfect prediction)."""
        result = val_bpb(0.0)
        
        assert result == 0.0

    def test_val_bpb_vocab_independent(self):
        """Test: val_bpb allows vocab-size comparison."""
        # Same formulation, different loss values
        loss1 = 1.0
        loss2 = 2.0
        
        bpb1 = val_bpb(loss1)
        bpb2 = val_bpb(loss2)
        
        # Relationship should hold: bpb2 ≈ 2 * bpb1
        assert abs((bpb2 / bpb1) - 2.0) < 1e-10


# ============================================================================
# Tests for humaneval_pass1()
# ============================================================================

class TestHumanevalPass1:
    """Test suite for humaneval_pass1() function."""

    def test_humaneval_pass1_returns_float(self, temp_checkpoint_path):
        """Test: humaneval_pass1 returns a float."""
        result = humaneval_pass1(temp_checkpoint_path, timeout=5)
        
        assert isinstance(result, float)

    def test_humaneval_pass1_in_valid_range(self, temp_checkpoint_path):
        """Test: humaneval_pass1 returns value in [0.0, 1.0]."""
        result = humaneval_pass1(temp_checkpoint_path, timeout=5)
        
        assert 0.0 <= result <= 1.0, "Pass@1 must be in [0.0, 1.0]"

    def test_humaneval_pass1_deterministic(self, temp_checkpoint_path):
        """Test: Same checkpoint → same result (no randomness)."""
        result1 = humaneval_pass1(temp_checkpoint_path, timeout=5)
        result2 = humaneval_pass1(temp_checkpoint_path, timeout=5)
        result3 = humaneval_pass1(temp_checkpoint_path, timeout=5)
        
        assert result1 == result2 == result3, "humaneval_pass1 must be deterministic"

    def test_humaneval_pass1_mocked_value(self, temp_checkpoint_path):
        """Test: Mocked value is constant (Phase 2.3)."""
        # In Phase 2.3, this should return a fixed mock value
        result = humaneval_pass1(temp_checkpoint_path)
        
        # Expected mock value is 0.42
        assert result == 0.42 or (0.3 <= result <= 0.6), \
            "Mocked humaneval_pass1 should return reasonable constant"


# ============================================================================
# Tests for code_quality_score()
# ============================================================================

class TestCodeQualityScore:
    """Test suite for code_quality_score() function."""

    def test_code_quality_score_returns_float(self, temp_checkpoint_path):
        """Test: code_quality_score returns a float."""
        result = code_quality_score(temp_checkpoint_path)
        
        assert isinstance(result, float)

    def test_code_quality_score_in_valid_range(self, temp_checkpoint_path):
        """Test: code_quality_score returns value in [0.0, 1.0]."""
        result = code_quality_score(temp_checkpoint_path)
        
        assert 0.0 <= result <= 1.0, "Code quality score must be in [0.0, 1.0]"

    def test_code_quality_score_deterministic(self, temp_checkpoint_path):
        """Test: Same checkpoint → same result (no randomness)."""
        result1 = code_quality_score(temp_checkpoint_path)
        result2 = code_quality_score(temp_checkpoint_path)
        result3 = code_quality_score(temp_checkpoint_path)
        
        assert result1 == result2 == result3, "code_quality_score must be deterministic"

    def test_code_quality_score_mocked_value(self, temp_checkpoint_path):
        """Test: Mocked value is constant (Phase 2.3)."""
        # In Phase 2.3, this should return a fixed mock value
        result = code_quality_score(temp_checkpoint_path)
        
        # Expected mock value is 0.5
        assert result == 0.5, "Mocked code_quality_score should return 0.5"


# ============================================================================
# Tests for MetricCalculator class
# ============================================================================

class TestMetricCalculator:
    """Test suite for MetricCalculator class."""

    def test_metric_calculator_init(self, mock_validation_dataset):
        """Test: MetricCalculator initializes correctly."""
        calc = MetricCalculator(mock_validation_dataset)
        
        assert calc.val_dataset is mock_validation_dataset
        assert hasattr(calc, 'metrics')
        assert isinstance(calc.metrics, dict)

    def test_metric_calculator_has_all_metrics(self, mock_validation_dataset):
        """Test: MetricCalculator has all required metric functions."""
        calc = MetricCalculator(mock_validation_dataset)
        
        required_metrics = ["val_loss", "val_bpb", "humaneval_pass1", "code_quality"]
        for metric in required_metrics:
            assert metric in calc.metrics, f"Missing metric: {metric}"

    def test_metric_calculator_compute_all_single_metric(self, mock_validation_dataset, temp_checkpoint_path):
        """Test: compute_all with single metric."""
        calc = MetricCalculator(mock_validation_dataset)
        
        requested = ["humaneval_pass1"]
        results = calc.compute_all(temp_checkpoint_path, requested)
        
        assert isinstance(results, dict)
        assert "humaneval_pass1" in results
        assert isinstance(results["humaneval_pass1"], float)

    def test_metric_calculator_compute_all_multiple_metrics(self, mock_validation_dataset, temp_checkpoint_path):
        """Test: compute_all with multiple metrics."""
        calc = MetricCalculator(mock_validation_dataset)
        
        requested = ["humaneval_pass1", "code_quality"]
        results = calc.compute_all(temp_checkpoint_path, requested)
        
        assert isinstance(results, dict)
        assert "humaneval_pass1" in results
        assert "code_quality" in results
        assert isinstance(results["humaneval_pass1"], float)
        assert isinstance(results["code_quality"], float)

    def test_metric_calculator_compute_all_ignores_unknown(self, mock_validation_dataset, temp_checkpoint_path):
        """Test: compute_all ignores unknown metrics."""
        calc = MetricCalculator(mock_validation_dataset)
        
        requested = ["humaneval_pass1", "unknown_metric"]
        results = calc.compute_all(temp_checkpoint_path, requested)
        
        assert "humaneval_pass1" in results
        assert "unknown_metric" not in results

    def test_metric_calculator_compute_all_deterministic(self, mock_validation_dataset, temp_checkpoint_path):
        """Test: compute_all produces deterministic results."""
        calc = MetricCalculator(mock_validation_dataset)
        
        requested = ["humaneval_pass1", "code_quality"]
        results1 = calc.compute_all(temp_checkpoint_path, requested)
        results2 = calc.compute_all(temp_checkpoint_path, requested)
        
        assert results1 == results2, "compute_all must be deterministic"

    def test_metric_calculator_empty_request(self, mock_validation_dataset, temp_checkpoint_path):
        """Test: compute_all with empty request list."""
        calc = MetricCalculator(mock_validation_dataset)
        
        requested = []
        results = calc.compute_all(temp_checkpoint_path, requested)
        
        assert isinstance(results, dict)
        assert len(results) == 0


# ============================================================================
# Tests for Configuration
# ============================================================================

class TestMetricConfiguration:
    """Test suite for metric configuration."""

    def test_metric_config_exists(self):
        """Test: METRIC_CONFIG is defined."""
        assert METRIC_CONFIG is not None
        assert isinstance(METRIC_CONFIG, dict)

    def test_metric_config_has_all_metrics(self):
        """Test: METRIC_CONFIG contains all metrics."""
        required = ["val_loss", "val_bpb", "humaneval_pass1", "code_quality"]
        
        for metric in required:
            assert metric in METRIC_CONFIG, f"Missing in METRIC_CONFIG: {metric}"

    def test_metric_config_has_type_field(self):
        """Test: Each metric in METRIC_CONFIG has 'type' field."""
        for metric_name, config in METRIC_CONFIG.items():
            assert "type" in config, f"Missing 'type' in {metric_name}"
            assert config["type"] in ["minimize", "maximize"], \
                f"Invalid type for {metric_name}: {config['type']}"

    def test_metric_config_has_description(self):
        """Test: Each metric in METRIC_CONFIG has 'description' field."""
        for metric_name, config in METRIC_CONFIG.items():
            assert "description" in config, f"Missing 'description' in {metric_name}"

    def test_default_primary_metric_exists(self):
        """Test: DEFAULT_PRIMARY_METRIC is defined."""
        assert DEFAULT_PRIMARY_METRIC is not None
        assert isinstance(DEFAULT_PRIMARY_METRIC, str)

    def test_default_primary_metric_in_config(self):
        """Test: DEFAULT_PRIMARY_METRIC is in METRIC_CONFIG."""
        assert DEFAULT_PRIMARY_METRIC in METRIC_CONFIG


# ============================================================================
# Integration Tests
# ============================================================================

class TestMetricIntegration:
    """Integration tests for metrics module."""

    def test_val_loss_to_bpb_pipeline(self, mock_validation_dataset):
        """Test: val_loss → val_bpb pipeline works end-to-end."""
        model_output = {
            "logits": [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]],
        }
        labels = [0, 1]
        
        loss = val_loss(model_output, labels)
        bpb = val_bpb(loss)
        
        assert isinstance(loss, float)
        assert isinstance(bpb, float)
        assert bpb == loss / math.log(2)

    def test_metric_immutability(self, mock_validation_dataset, temp_checkpoint_path):
        """Test: Same inputs always produce same outputs (immutability)."""
        calc = MetricCalculator(mock_validation_dataset)
        
        # Run twice
        run1 = calc.compute_all(temp_checkpoint_path, ["humaneval_pass1", "code_quality"])
        run2 = calc.compute_all(temp_checkpoint_path, ["humaneval_pass1", "code_quality"])
        
        # Results must be identical
        assert run1 == run2, "Metrics must be immutable"

    def test_all_metrics_return_valid_types(self, mock_validation_dataset, temp_checkpoint_path):
        """Test: All metrics return valid numeric types."""
        calc = MetricCalculator(mock_validation_dataset)
        
        all_metrics = list(calc.metrics.keys())
        results = calc.compute_all(temp_checkpoint_path, all_metrics)
        
        for metric_name, value in results.items():
            assert isinstance(value, (int, float)), \
                f"{metric_name} returned {type(value)}, expected numeric"
            assert not math.isnan(value), f"{metric_name} returned NaN"
            assert not math.isinf(value), f"{metric_name} returned Inf"
