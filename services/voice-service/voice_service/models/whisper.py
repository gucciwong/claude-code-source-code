"""Automatic Speech Recognition (ASR) using OpenAI Whisper."""

import logging
import os
import time
from pathlib import Path
from typing import Optional
import torch

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

from voice_service.config.device_config import DeviceConfig

logger = logging.getLogger(__name__)


class WhisperASR:
    """Wrapper for OpenAI Whisper ASR model with GPU support."""

    # Model sizes and typical VRAM requirements (GB)
    VRAM_REQUIREMENTS = {
        "tiny": 1,
        "base": 1.5,
        "small": 2,
        "medium": 5,
        "large": 10,
    }

    def __init__(
        self, 
        model_size: str = "base", 
        device: str = "auto",
        compute_type: str = "default"
    ):
        """
        Initialize Whisper ASR model with GPU support.
        
        Args:
            model_size: Model size ('tiny', 'base', 'small', 'medium', 'large')
            device: Device to run model on ('cuda', 'mps', 'cpu', or 'auto' for auto-detect)
            compute_type: Computation type ('default', 'float16', 'int8')
        """
        self.model_size = model_size
        self.requested_device = device
        self.device = DeviceConfig.get_device_with_fallback(device)
        self.compute_type = compute_type
        self.model = None
        self.is_loaded = False
        self.load_time = 0.0
        self._load_model()

    def _load_model(self) -> None:
        """Load Whisper model from cache or download."""
        if not WHISPER_AVAILABLE:
            logger.warning("Whisper not available. Install with: pip install openai-whisper")
            return

        try:
            start_time = time.time()
            logger.info(f"Loading Whisper model: {self.model_size} on {self.device}")
            
            # Load model with device specification
            self.model = whisper.load_model(self.model_size, device=self.device)
            
            # Apply compute type optimization
            if self.compute_type == "float16" and self.device == "cuda":
                self.model = self.model.half()
                logger.info("Applied FP16 (half precision) optimization")
            
            self.is_loaded = True
            self.load_time = time.time() - start_time
            
            # Log device info
            device_info = DeviceConfig.get_device_info()
            logger.info(f"Whisper model loaded successfully in {self.load_time:.2f}s")
            logger.info(f"Device: {self.device}, GPU available: {device_info.get('cuda_available')}")
            
            if device_info.get("gpu"):
                gpu_mem = device_info["gpu"]
                logger.info(f"GPU Memory: {gpu_mem['allocated_gb']:.2f}GB / {gpu_mem['total_memory_gb']:.2f}GB")
                
        except RuntimeError as e:
            if "CUDA" in str(e) or "cuda" in str(e):
                logger.warning(f"CUDA error: {e}. Falling back to CPU.")
                self.device = "cpu"
                try:
                    self.model = whisper.load_model(self.model_size, device="cpu")
                    self.is_loaded = True
                    self.load_time = time.time() - start_time
                    logger.info("Model loaded on CPU fallback")
                except Exception as e2:
                    logger.error(f"Failed to load model on CPU: {e2}")
                    self.is_loaded = False
            else:
                logger.error(f"Failed to load Whisper model: {e}")
                self.is_loaded = False
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            self.is_loaded = False

    def transcribe(
        self, 
        audio_path: str, 
        language: Optional[str] = None,
        task: str = "transcribe"
    ) -> dict:
        """
        Transcribe audio file to text.
        
        Args:
            audio_path: Path to audio file
            language: ISO-639-1 language code (e.g., 'en', 'zh')
            task: Task type ('transcribe' or 'translate')
            
        Returns:
            Dict with 'text', 'language', 'confidence' keys and timing info
        """
        if not self.is_loaded or self.model is None:
            return {
                "text": "",
                "language": language or "unknown",
                "confidence": 0.0,
                "error": "Whisper model not loaded",
                "inference_time": 0.0
            }

        try:
            if not Path(audio_path).exists():
                return {
                    "text": "",
                    "language": language or "unknown",
                    "confidence": 0.0,
                    "error": f"Audio file not found: {audio_path}",
                    "inference_time": 0.0
                }

            start_time = time.time()
            result = self.model.transcribe(
                audio_path,
                language=language,
                task=task,
                verbose=False
            )
            inference_time = time.time() - start_time

            return {
                "text": result.get("text", "").strip(),
                "language": result.get("language", language or "unknown"),
                "confidence": result.get("confidence", 0.0),
                "segments": result.get("segments", []),
                "inference_time": round(inference_time, 3),
                "device": self.device,
            }
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return {
                "text": "",
                "language": language or "unknown",
                "confidence": 0.0,
                "error": str(e),
                "inference_time": 0.0
            }

    def get_supported_languages(self) -> list:
        """Return list of supported language codes."""
        return [
            "en", "zh", "de", "es", "fr", "ja", "ko", "pt", "ru", "ar", "hi"
        ]  # Common languages; Whisper supports 100+

    def get_device_info(self) -> dict:
        """Get detailed device information."""
        device_info = DeviceConfig.get_device_info()
        device_info.update({
            "model_size": self.model_size,
            "model_loaded": self.is_loaded,
            "load_time_seconds": round(self.load_time, 3),
            "vram_required_gb": self.VRAM_REQUIREMENTS.get(self.model_size, 0),
            "compute_type": self.compute_type,
        })
        return device_info

    def unload(self) -> None:
        """Unload model from memory."""
        if self.model is not None:
            del self.model
            self.model = None
            self.is_loaded = False
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            logger.info("Whisper model unloaded and CUDA cache cleared")

