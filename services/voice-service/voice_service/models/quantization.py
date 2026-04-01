"""Model quantization utilities for ONNX optimization."""

import numpy as np
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class QuantizationType(str, Enum):
    """Quantization type options."""
    FP32 = "fp32"  # 32-bit float (no quantization)
    FP16 = "fp16"  # 16-bit float (half precision)
    INT8 = "int8"  # 8-bit integer
    INT4 = "int4"  # 4-bit integer (extreme compression)
    MIXED = "mixed"  # Mixed precision (FP32 for critical layers, INT8 for others)


class QuantizationConfig:
    """Configuration for model quantization."""

    def __init__(
        self,
        quantization_type: QuantizationType = QuantizationType.INT8,
        per_channel: bool = True,
        calibration_data_size: int = 100,
        reduce_range: bool = False,
    ):
        """
        Initialize quantization configuration.

        Args:
            quantization_type: Type of quantization (fp32, fp16, int8, int4, mixed)
            per_channel: Use per-channel quantization (more accurate, slower)
            calibration_data_size: Number of samples for calibration
            reduce_range: Reduce weight range for INT8 (saves memory)
        """
        self.quantization_type = quantization_type
        self.per_channel = per_channel
        self.calibration_data_size = calibration_data_size
        self.reduce_range = reduce_range

    def to_dict(self) -> Dict[str, Any]:
        """Export config to dictionary."""
        return {
            "quantization_type": self.quantization_type.value,
            "per_channel": self.per_channel,
            "calibration_data_size": self.calibration_data_size,
            "reduce_range": self.reduce_range,
        }


class QuantizationStats:
    """Statistics about quantized model."""

    def __init__(
        self,
        original_size_mb: float,
        quantized_size_mb: float,
        compression_ratio: float,
        inference_speedup: float,
        accuracy_degradation: float,
    ):
        """
        Initialize quantization stats.

        Args:
            original_size_mb: Original model size in MB
            quantized_size_mb: Quantized model size in MB
            compression_ratio: Compression ratio (original / quantized)
            inference_speedup: Speedup factor (quantized latency / original latency)
            accuracy_degradation: Accuracy loss (0.0 to 1.0, lower is better)
        """
        self.original_size_mb = original_size_mb
        self.quantized_size_mb = quantized_size_mb
        self.compression_ratio = compression_ratio
        self.inference_speedup = inference_speedup
        self.accuracy_degradation = accuracy_degradation

    def to_dict(self) -> Dict[str, Any]:
        """Export stats to dictionary."""
        return {
            "original_size_mb": self.original_size_mb,
            "quantized_size_mb": self.quantized_size_mb,
            "compression_ratio": f"{self.compression_ratio:.2f}x",
            "inference_speedup": f"{self.inference_speedup:.2f}x",
            "accuracy_degradation_percent": f"{self.accuracy_degradation * 100:.2f}%",
        }

    def __repr__(self) -> str:
        """String representation."""
        return (
            f"QuantizationStats(size={self.original_size_mb:.1f}MB → "
            f"{self.quantized_size_mb:.1f}MB [{self.compression_ratio:.2f}x], "
            f"speedup={self.inference_speedup:.2f}x, "
            f"accuracy_loss={self.accuracy_degradation*100:.2f}%)"
        )


def calculate_quantization_stats(
    original_model_path: Path,
    quantized_model_path: Path,
    original_latency_ms: float,
    quantized_latency_ms: float,
    accuracy_before: float,
    accuracy_after: float,
) -> QuantizationStats:
    """
    Calculate quantization statistics.

    Args:
        original_model_path: Path to original (unquantized) model
        quantized_model_path: Path to quantized model
        original_latency_ms: Original inference latency (ms)
        quantized_latency_ms: Quantized inference latency (ms)
        accuracy_before: Original model accuracy (0.0-1.0)
        accuracy_after: Quantized model accuracy (0.0-1.0)

    Returns:
        QuantizationStats object with metrics
    """
    # Get file sizes
    original_size = original_model_path.stat().st_size / (1024 * 1024)  # MB
    quantized_size = quantized_model_path.stat().st_size / (1024 * 1024)  # MB

    # Calculate metrics
    compression_ratio = original_size / quantized_size if quantized_size > 0 else 1.0
    inference_speedup = original_latency_ms / quantized_latency_ms if quantized_latency_ms > 0 else 1.0
    accuracy_degradation = max(0.0, accuracy_before - accuracy_after)

    stats = QuantizationStats(
        original_size_mb=original_size,
        quantized_size_mb=quantized_size,
        compression_ratio=compression_ratio,
        inference_speedup=inference_speedup,
        accuracy_degradation=accuracy_degradation,
    )

    logger.info(f"Quantization stats: {stats}")
    return stats


def get_quantization_presets() -> Dict[str, QuantizationConfig]:
    """
    Get predefined quantization presets.

    Returns:
        Dictionary of preset name to QuantizationConfig
    """
    return {
        "conservative": QuantizationConfig(
            quantization_type=QuantizationType.FP16,
            per_channel=True,
            calibration_data_size=100,
            reduce_range=False,
        ),
        "balanced": QuantizationConfig(
            quantization_type=QuantizationType.INT8,
            per_channel=True,
            calibration_data_size=500,
            reduce_range=False,
        ),
        "aggressive": QuantizationConfig(
            quantization_type=QuantizationType.INT4,
            per_channel=True,
            calibration_data_size=1000,
            reduce_range=True,
        ),
        "mixed": QuantizationConfig(
            quantization_type=QuantizationType.MIXED,
            per_channel=True,
            calibration_data_size=200,
            reduce_range=False,
        ),
    }


def estimate_model_size_reduction(
    quantization_type: QuantizationType, original_size_mb: float
) -> Tuple[float, str]:
    """
    Estimate model size reduction for quantization type.

    Args:
        quantization_type: Type of quantization
        original_size_mb: Original model size in MB

    Returns:
        Tuple of (estimated_size_mb, compression_description)
    """
    multipliers = {
        QuantizationType.FP32: 1.0,
        QuantizationType.FP16: 0.5,  # ~50% reduction
        QuantizationType.INT8: 0.25,  # ~75% reduction
        QuantizationType.INT4: 0.125,  # ~87.5% reduction
        QuantizationType.MIXED: 0.375,  # ~62.5% reduction (average)
    }

    multiplier = multipliers.get(quantization_type, 1.0)
    estimated_size = original_size_mb * multiplier

    descriptions = {
        QuantizationType.FP32: "No quantization",
        QuantizationType.FP16: "Half precision (50% reduction)",
        QuantizationType.INT8: "8-bit integer (75% reduction)",
        QuantizationType.INT4: "4-bit integer (87.5% reduction)",
        QuantizationType.MIXED: "Mixed precision (62.5% reduction)",
    }

    description = descriptions.get(quantization_type, "Unknown")
    return estimated_size, description
