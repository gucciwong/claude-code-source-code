"""
Metric calculation helpers for evaluation harness

Phase 2.3: Metric Definitions
Implements metric calculation functions for autoresearch evaluation pipeline.
All metrics are deterministic (no randomness) to ensure reproducible evaluation.

Metrics:
- val_loss: Primary metric, cross-entropy loss on validation set
- val_bpb: Derived metric, bits-per-byte (vocab-size-independent)
- humaneval_pass1: Pass@1 on HumanEval benchmark (mocked for Phase 2.3)
- code_quality_score: Syntax/style score (mocked for Phase 2.3)
"""

import math
from pathlib import Path
from typing import Optional, Dict, List, Any


def loss_to_bpb(loss: float) -> float:
    """
    Convert cross-entropy loss to bits-per-byte (bpb).
    
    Formula: bpb = loss / ln(2)
    
    This is equivalent to: perplexity = 2^loss, then convert to information-theoretic bits.
    
    Args:
        loss: Cross-entropy loss (scalar)
    
    Returns:
        Bits-per-byte value (lower is better)
    """
    if loss < 0:
        raise ValueError(f"Loss must be non-negative, got {loss}")
    return loss / math.log(2)


def loss_to_perplexity(loss: float) -> float:
    """
    Convert cross-entropy loss to perplexity.
    
    Formula: perplexity = exp(loss)
    
    Args:
        loss: Cross-entropy loss (scalar)
    
    Returns:
        Perplexity value (lower is better)
    """
    if loss < 0:
        raise ValueError(f"Loss must be non-negative, got {loss}")
    return math.exp(loss)


def validate_metrics_dict(metrics_dict: dict, expected_metrics: list[str]) -> None:
    """
    Validate that metrics dict contains all expected metrics.
    
    Args:
        metrics_dict: Dictionary of metrics
        expected_metrics: List of metric names that should be present
    
    Raises:
        ValueError: If any expected metric is missing or invalid
    """
    for metric in expected_metrics:
        if metric not in metrics_dict:
            raise ValueError(f"Missing metric: {metric}")
        
        value = metrics_dict[metric]
        if not isinstance(value, (int, float)) or math.isnan(value):
            raise ValueError(f"Invalid metric value for {metric}: {value}")
        
        if value < 0:
            raise ValueError(f"Metric {metric} must be non-negative, got {value}")


# ============================================================================
# Phase 2.3: Metric Calculation Functions
# ============================================================================

def val_loss(model_output: Dict[str, Any], labels: List[float]) -> float:
    """
    Cross-entropy loss on validation set.
    
    This is the PRIMARY metric for keep/discard decisions.
    Deterministic evaluation: same model → same loss.
    
    Formula: mean(-log(predicted_prob))
    
    Args:
        model_output: Dict containing model outputs (e.g., {'logits': tensor})
        labels: List of ground truth labels
    
    Returns:
        Cross-entropy loss (scalar float, lower is better)
    
    Note:
        Phase 2.3: Mocked implementation using torch.nn.functional.cross_entropy
        Excludes padding tokens (if applicable)
    """
    try:
        import torch
        import torch.nn.functional as F
    except ImportError:
        raise ImportError("torch required for val_loss calculation")
    
    # Extract logits from model output
    if "logits" not in model_output:
        raise ValueError("model_output must contain 'logits' key")
    
    logits = model_output["logits"]
    
    # Convert to torch tensors if needed
    if not isinstance(logits, torch.Tensor):
        logits = torch.tensor(logits, dtype=torch.float32)
    if not isinstance(labels, torch.Tensor):
        labels = torch.tensor(labels, dtype=torch.long)
    
    # Compute cross-entropy loss
    loss = F.cross_entropy(logits, labels, reduction='mean')
    
    # Return as scalar float
    return float(loss.item())


def val_bpb(val_loss_value: float) -> float:
    """
    Bits Per Byte metric.
    
    Vocab-size-independent metric (similar to autoresearch).
    Allows comparing models with different vocabularies fairly.
    
    Formula: val_bpb = val_loss / ln(2)
    where ln(2) ≈ 0.693147...
    
    Args:
        val_loss_value: Cross-entropy loss (from val_loss function)
    
    Returns:
        Bits-per-byte value (scalar float, lower is better)
    """
    if val_loss_value < 0:
        raise ValueError(f"val_loss must be non-negative, got {val_loss_value}")
    
    # Use the existing conversion function
    return loss_to_bpb(val_loss_value)


def humaneval_pass1(model_checkpoint: Path, timeout: int = 5) -> float:
    """
    Pass@1 on HumanEval benchmark.
    
    Measures: For each problem, can the model generate ONE solution that passes all tests?
    
    Args:
        model_checkpoint: Path to model checkpoint
        timeout: Execution timeout per test (seconds)
    
    Returns:
        Pass@1 score (float in [0.0, 1.0], higher is better)
    
    Note:
        Phase 2.3: MOCKED as constant 0.42
        Future (Phase 3+): Integrate with real HumanEval benchmarks
        Must be deterministic (no randomness)
    """
    # Phase 2.3: Mock implementation
    # Returns fixed constant for reproducibility
    return 0.42


def code_quality_score(model_checkpoint: Path) -> float:
    """
    Syntactic correctness and style score.
    
    Measures: Code quality across syntactic and stylistic dimensions.
    
    Args:
        model_checkpoint: Path to model checkpoint
    
    Returns:
        Code quality score (float in [0.0, 1.0], higher is better)
    
    Note:
        Phase 2.3: MOCKED as constant 0.5
        Future: AST validation + pylint-like checks
        Must be deterministic (no randomness)
    """
    # Phase 2.3: Mock implementation
    # Returns fixed constant for reproducibility
    return 0.5


# ============================================================================
# Metric Configuration
# ============================================================================

METRIC_CONFIG = {
    "val_loss": {
        "type": "minimize",
        "description": "Cross-entropy loss on validation set (primary metric)"
    },
    "val_bpb": {
        "type": "minimize",
        "description": "Bits per byte (vocab-size-independent)"
    },
    "humaneval_pass1": {
        "type": "maximize",
        "description": "HumanEval pass@1 benchmark score"
    },
    "code_quality": {
        "type": "maximize",
        "description": "Code quality and style score"
    },
}

# Default primary metric (used by keep/discard logic)
DEFAULT_PRIMARY_METRIC = "val_loss"


# ============================================================================
# MetricCalculator Class
# ============================================================================

class MetricCalculator:
    """
    Computes fixed metrics for evaluation.
    
    Wraps metric functions into a cohesive interface.
    All outputs are deterministic (no randomness).
    
    Attributes:
        val_dataset: ValidationDataset instance
        metrics: Dict mapping metric names to computation functions
    """
    
    def __init__(self, val_dataset):
        """
        Initialize MetricCalculator.
        
        Args:
            val_dataset: ValidationDataset instance (or mock)
        """
        self.val_dataset = val_dataset
        
        # Map metric names to compute methods
        self.metrics = {
            "val_loss": self.compute_val_loss,
            "val_bpb": self.compute_val_bpb,
            "humaneval_pass1": self.compute_humaneval_pass1,
            "code_quality": self.compute_code_quality,
        }
    
    def compute_val_loss(self, model_checkpoint: Path) -> float:
        """Compute validation loss on validation dataset."""
        # Phase 2.3: Mock implementation
        # In Phase 3+: Load model and evaluate on validation set
        return 2.5  # Fixed mock value
    
    def compute_val_bpb(self, model_checkpoint: Path) -> float:
        """Compute bits-per-byte from validation loss."""
        loss = self.compute_val_loss(model_checkpoint)
        return val_bpb(loss)
    
    def compute_humaneval_pass1(self, model_checkpoint: Path) -> float:
        """Compute HumanEval pass@1 score."""
        return humaneval_pass1(model_checkpoint)
    
    def compute_code_quality(self, model_checkpoint: Path) -> float:
        """Compute code quality score."""
        return code_quality_score(model_checkpoint)
    
    def compute_all(
        self,
        model_checkpoint: Path,
        requested_metrics: List[str]
    ) -> Dict[str, float]:
        """
        Compute all requested metrics.
        
        Args:
            model_checkpoint: Path to model checkpoint
            requested_metrics: List of metric names to compute
        
        Returns:
            Dict mapping metric names to computed values
        
        Note:
            Deterministic: Same checkpoint → same results
            Ignores unknown metric names silently
        """
        results = {}
        
        for metric_name in requested_metrics:
            if metric_name in self.metrics:
                compute_fn = self.metrics[metric_name]
                results[metric_name] = compute_fn(model_checkpoint)
        
        return results
