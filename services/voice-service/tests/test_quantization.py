"""Tests for model quantization and optimization."""

import pytest
import tempfile
from pathlib import Path
import numpy as np

from voice_service.models.quantization import (
    QuantizationType,
    QuantizationConfig,
    QuantizationStats,
    calculate_quantization_stats,
    get_quantization_presets,
    estimate_model_size_reduction,
)
from voice_service.models.model_registry import ModelMetadata, ModelRegistry


class TestQuantizationConfig:
    """Test quantization configuration."""

    def test_config_initialization(self):
        """Test creating quantization config."""
        config = QuantizationConfig(
            quantization_type=QuantizationType.INT8,
            per_channel=True,
            calibration_data_size=200,
        )

        assert config.quantization_type == QuantizationType.INT8
        assert config.per_channel is True
        assert config.calibration_data_size == 200

    def test_config_to_dict(self):
        """Test converting config to dictionary."""
        config = QuantizationConfig(quantization_type=QuantizationType.FP16)
        config_dict = config.to_dict()

        assert "quantization_type" in config_dict
        assert config_dict["quantization_type"] == "fp16"

    def test_quantization_presets(self):
        """Test predefined quantization presets."""
        presets = get_quantization_presets()

        assert "conservative" in presets
        assert "balanced" in presets
        assert "aggressive" in presets
        assert "mixed" in presets

        # Verify conservative preset
        conservative = presets["conservative"]
        assert conservative.quantization_type == QuantizationType.FP16


class TestQuantizationStats:
    """Test quantization statistics calculation."""

    def test_stats_initialization(self):
        """Test creating quantization stats."""
        stats = QuantizationStats(
            original_size_mb=290.0,
            quantized_size_mb=73.0,
            compression_ratio=3.97,
            inference_speedup=2.5,
            accuracy_degradation=0.01,
        )

        assert stats.original_size_mb == 290.0
        assert stats.quantized_size_mb == 73.0
        assert abs(stats.compression_ratio - 3.97) < 0.01

    def test_stats_to_dict(self):
        """Test exporting stats to dictionary."""
        stats = QuantizationStats(
            original_size_mb=290.0,
            quantized_size_mb=73.0,
            compression_ratio=3.97,
            inference_speedup=2.5,
            accuracy_degradation=0.01,
        )

        stats_dict = stats.to_dict()
        assert "original_size_mb" in stats_dict
        assert "compression_ratio" in stats_dict
        assert "3.97x" in stats_dict["compression_ratio"]

    def test_calculate_stats(self):
        """Test calculating quantization stats from files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)

            # Create dummy files
            original_file = tmpdir / "model.onnx"
            quantized_file = tmpdir / "model-int8.onnx"

            original_file.write_text("x" * (290 * 1024 * 1024))  # 290MB
            quantized_file.write_text("x" * (73 * 1024 * 1024))  # 73MB

            stats = calculate_quantization_stats(
                original_file,
                quantized_file,
                original_latency_ms=6000.0,
                quantized_latency_ms=2400.0,
                accuracy_before=0.95,
                accuracy_after=0.94,
            )

            assert stats.original_size_mb > 280  # ~290MB
            assert stats.quantized_size_mb > 70  # ~73MB
            assert stats.accuracy_degradation == pytest.approx(0.01, abs=0.01)


class TestModelRegistry:
    """Test model registry functionality."""

    def test_registry_initialization(self):
        """Test creating model registry."""
        with tempfile.TemporaryDirectory() as tmpdir:
            registry = ModelRegistry(cache_dir=Path(tmpdir))

            assert registry.cache_dir.exists()
            assert len(registry.models) > 0

    def test_get_model(self):
        """Test retrieving model from registry."""
        with tempfile.TemporaryDirectory() as tmpdir:
            registry = ModelRegistry(cache_dir=Path(tmpdir))

            model = registry.get_model("whisper-base")
            assert model is not None
            assert model.model_id == "whisper-base"
            assert model.model_type == "asr"

    def test_list_models(self):
        """Test listing models by type."""
        with tempfile.TemporaryDirectory() as tmpdir:
            registry = ModelRegistry(cache_dir=Path(tmpdir))

            asr_models = registry.list_models(model_type="asr")
            assert len(asr_models) > 0

            for model in asr_models:
                assert model.model_type == "asr"

    def test_is_cached(self):
        """Test checking if model is cached."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            registry = ModelRegistry(cache_dir=tmpdir)

            # Initially not cached
            assert not registry.is_cached("whisper-base")

            # Create fake cached file
            model_path = registry.get_model_path("whisper-base")
            model_path.write_text("dummy model")

            assert registry.is_cached("whisper-base")

    def test_register_custom_model(self):
        """Test registering custom model."""
        with tempfile.TemporaryDirectory() as tmpdir:
            registry = ModelRegistry(cache_dir=Path(tmpdir))

            custom_model = ModelMetadata(
                model_id="whisper-custom",
                name="Custom Whisper",
                model_type="asr",
                url="https://example.com/model.onnx",
                size_mb=500.0,
                checksum="abc123",
                quantization_type="int8",
                accuracy=0.93,
            )

            registry.register_model(custom_model)
            retrieved = registry.get_model("whisper-custom")

            assert retrieved is not None
            assert retrieved.model_id == "whisper-custom"

    def test_cache_size(self):
        """Test calculating cache size."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            registry = ModelRegistry(cache_dir=tmpdir)

            # Add some dummy cached files
            (tmpdir / "model1.onnx").write_text("x" * 1000)
            (tmpdir / "model2.onnx").write_text("y" * 2000)

            cache_size = registry.get_cache_size_mb()
            expected_size = 3000 / (1024 * 1024)
            assert cache_size == pytest.approx(expected_size, rel=0.01)

    def test_registry_summary(self):
        """Test getting registry summary."""
        with tempfile.TemporaryDirectory() as tmpdir:
            registry = ModelRegistry(cache_dir=Path(tmpdir))
            summary = registry.get_registry_summary()

            assert "total_models" in summary
            assert "asr_models" in summary
            assert "cache_size_mb" in summary
            assert "models" in summary

            # Should have at least Whisper models
            assert summary["total_models"] >= 2


class TestSizeReductionEstimation:
    """Test size reduction estimation."""

    def test_estimate_fp32(self):
        """Test size estimation for FP32 (no quantization)."""
        size, desc = estimate_model_size_reduction(QuantizationType.FP32, 290.0)
        assert size == pytest.approx(290.0, abs=1.0)
        assert "No quantization" in desc

    def test_estimate_fp16(self):
        """Test size estimation for FP16."""
        size, desc = estimate_model_size_reduction(QuantizationType.FP16, 290.0)
        assert size == pytest.approx(145.0, abs=1.0)  # 50% reduction
        assert "50%" in desc

    def test_estimate_int8(self):
        """Test size estimation for INT8."""
        size, desc = estimate_model_size_reduction(QuantizationType.INT8, 290.0)
        assert size == pytest.approx(72.5, abs=1.0)  # 75% reduction
        assert "75%" in desc

    def test_estimate_int4(self):
        """Test size estimation for INT4."""
        size, desc = estimate_model_size_reduction(QuantizationType.INT4, 290.0)
        assert size == pytest.approx(36.25, abs=1.0)  # 87.5% reduction
        assert "87.5%" in desc


class TestModelMetadata:
    """Test model metadata."""

    def test_metadata_initialization(self):
        """Test creating model metadata."""
        metadata = ModelMetadata(
            model_id="test-model",
            name="Test Model",
            model_type="asr",
            url="https://example.com/model.onnx",
            size_mb=100.0,
            checksum="abc123",
        )

        assert metadata.model_id == "test-model"
        assert metadata.model_type == "asr"

    def test_metadata_to_dict(self):
        """Test exporting metadata to dictionary."""
        metadata = ModelMetadata(
            model_id="test-model",
            name="Test Model",
            model_type="asr",
            url="https://example.com/model.onnx",
            size_mb=100.0,
            checksum="abc123",
        )

        data = metadata.to_dict()
        assert data["model_id"] == "test-model"
        assert "url" in data

    def test_metadata_from_dict(self):
        """Test creating metadata from dictionary."""
        data = {
            "model_id": "test-model",
            "name": "Test Model",
            "model_type": "asr",
            "url": "https://example.com/model.onnx",
            "size_mb": 100.0,
            "checksum": "abc123",
        }

        metadata = ModelMetadata.from_dict(data)
        assert metadata.model_id == "test-model"
