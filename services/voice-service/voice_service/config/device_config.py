"""GPU/CPU device detection and configuration."""

import logging
from typing import Literal
import torch

logger = logging.getLogger(__name__)

DeviceType = Literal["cuda", "mps", "cpu"]


class DeviceConfig:
    """Hardware device detection and configuration."""

    @staticmethod
    def get_available_device() -> DeviceType:
        """
        Auto-detect best available device.
        
        Priority: CUDA > MPS (Apple Metal) > CPU
        
        Returns:
            Device type: 'cuda', 'mps', or 'cpu'
        """
        if torch.cuda.is_available():
            device = "cuda"
            logger.info(f"CUDA available: {torch.cuda.get_device_name(0)}")
            logger.info(f"CUDA capability: {torch.cuda.get_device_capability(0)}")
            logger.info(f"CUDA VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
            return device
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            device = "mps"
            logger.info("Apple Metal Performance Shaders (MPS) available")
            return device
        else:
            device = "cpu"
            logger.info("Using CPU device")
            return device

    @staticmethod
    def get_device_with_fallback(preferred_device: str = "auto") -> str:
        """
        Get device with fallback chain.
        
        Args:
            preferred_device: 'cuda', 'mps', 'cpu', or 'auto'
            
        Returns:
            Valid PyTorch device string
        """
        if preferred_device == "auto":
            device = DeviceConfig.get_available_device()
        elif preferred_device == "cuda" and torch.cuda.is_available():
            device = "cuda"
        elif preferred_device == "mps" and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            device = "mps"
        else:
            logger.warning(f"Device {preferred_device} not available, falling back to CPU")
            device = "cpu"
        
        return device

    @staticmethod
    def get_gpu_memory() -> dict:
        """
        Get GPU memory information.
        
        Returns:
            Dict with memory stats
        """
        if not torch.cuda.is_available():
            return {"gpu_available": False}
        
        props = torch.cuda.get_device_properties(0)
        allocated = torch.cuda.memory_allocated(0) / 1e9
        reserved = torch.cuda.memory_reserved(0) / 1e9
        total = props.total_memory / 1e9
        
        return {
            "gpu_available": True,
            "device_name": props.name,
            "total_memory_gb": total,
            "allocated_gb": allocated,
            "reserved_gb": reserved,
            "free_gb": total - allocated,
            "utilization_percent": (allocated / total * 100) if total > 0 else 0,
        }

    @staticmethod
    def get_device_info() -> dict:
        """Get comprehensive device information."""
        device = DeviceConfig.get_available_device()
        
        info = {
            "device": device,
            "torch_version": torch.__version__,
            "cuda_available": torch.cuda.is_available(),
            "cuda_version": torch.version.cuda if torch.cuda.is_available() else None,
            "mps_available": hasattr(torch.backends, "mps") and torch.backends.mps.is_available(),
        }
        
        if torch.cuda.is_available():
            info["gpu"] = DeviceConfig.get_gpu_memory()
        
        return info
