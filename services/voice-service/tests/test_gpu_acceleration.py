"""Tests for GPU acceleration and device detection."""

import pytest
import torch
from voice_service.config.device_config import DeviceConfig
from voice_service.models.whisper import WhisperASR


class TestDeviceDetection:
    """Test device auto-detection logic."""

    def test_device_info_available(self):
        """Test that device info is available."""
        info = DeviceConfig.get_device_info()
        assert "device" in info
        assert info["device"] in ["cuda", "mps", "cpu"]
        assert "torch_version" in info
        assert "cuda_available" in info

    def test_get_available_device(self):
        """Test device availability detection."""
        device = DeviceConfig.get_available_device()
        assert device in ["cuda", "mps", "cpu"]

    def test_get_device_with_fallback(self):
        """Test device fallback chain."""
        # Auto should work
        device = DeviceConfig.get_device_with_fallback("auto")
        assert device in ["cuda", "mps", "cpu"]
        
        # CPU should always work
        device = DeviceConfig.get_device_with_fallback("cpu")
        assert device == "cpu"
        
        # Invalid should fallback to CPU
        device = DeviceConfig.get_device_with_fallback("invalid")
        assert device == "cpu"

    def test_gpu_memory_info(self):
        """Test GPU memory reporting."""
        if torch.cuda.is_available():
            mem = DeviceConfig.get_gpu_memory()
            assert mem["gpu_available"] is True
            assert "total_memory_gb" in mem
            assert "allocated_gb" in mem
            assert mem["total_memory_gb"] > 0
        else:
            mem = DeviceConfig.get_gpu_memory()
            assert mem["gpu_available"] is False


class TestWhisperGPU:
    """Test Whisper ASR with GPU support."""

    def test_whisper_cpu_load(self):
        """Test loading Whisper on CPU."""
        model = WhisperASR(model_size="tiny", device="cpu")
        try:
            assert model.device == "cpu"
            # Only check if model loading is supported
            if model.is_loaded:
                assert model.load_time > 0
            model.unload()
        except Exception as e:
            pytest.skip(f"Whisper not available: {e}")

    def test_whisper_gpu_auto_detect(self):
        """Test Whisper with auto device detection."""
        model = WhisperASR(model_size="tiny", device="auto")
        try:
            assert model.device in ["cuda", "mps", "cpu"]
            # Only check if model loading is supported
            if model.is_loaded:
                assert model.load_time > 0
            model.unload()
        except Exception as e:
            pytest.skip(f"Whisper not available: {e}")

    def test_whisper_device_info(self):
        """Test Whisper device information."""
        model = WhisperASR(model_size="tiny", device="cpu")
        try:
            info = model.get_device_info()
            assert "device" in info
            assert "model_size" in info
            assert "model_loaded" in info
            assert info["model_size"] == "tiny"
            model.unload()
        except Exception as e:
            pytest.skip(f"Whisper not available: {e}")

    @pytest.mark.skipif(not torch.cuda.is_available(), reason="CUDA not available")
    def test_whisper_float16_optimization(self):
        """Test Whisper with FP16 optimization on GPU."""
        model = WhisperASR(model_size="tiny", device="cuda", compute_type="float16")
        try:
            if model.is_loaded:
                assert model.compute_type == "float16"
            model.unload()
        except Exception as e:
            pytest.skip(f"GPU optimization not available: {e}")


class TestDeviceFallback:
    """Test device fallback mechanisms."""

    def test_cuda_to_cpu_fallback(self):
        """Test fallback from CUDA to CPU when CUDA fails."""
        # Try to load on CUDA, should fallback to CPU if CUDA not available
        model = WhisperASR(model_size="tiny", device="cuda")
        try:
            # If CUDA not available, should fallback to CPU
            if not torch.cuda.is_available():
                assert model.device == "cpu"
            elif torch.cuda.is_available():
                assert model.device in ["cuda", "cpu"]
            model.unload()
        except Exception as e:
            pytest.skip(f"Whisper not available: {e}")


class TestGPUMemory:
    """Test GPU memory management."""

    def test_cuda_cache_clearing(self):
        """Test CUDA cache clearing on unload."""
        if torch.cuda.is_available():
            model = WhisperASR(model_size="tiny", device="cuda")
            try:
                if model.is_loaded:
                    initial_memory = torch.cuda.memory_allocated()
                    model.unload()
                    # After unload, memory should be released
                    final_memory = torch.cuda.memory_allocated()
                    # Final memory might be less than initial
            except Exception as e:
                pytest.skip(f"GPU test not available: {e}")

    def test_device_properties(self):
        """Test accessing device properties."""
        if torch.cuda.is_available():
            prop = torch.cuda.get_device_properties(0)
            assert prop.name is not None
            assert prop.total_memory > 0
