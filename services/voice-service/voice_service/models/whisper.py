"""Automatic Speech Recognition (ASR) using OpenAI Whisper."""

import logging
import os
from pathlib import Path
from typing import Optional

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

logger = logging.getLogger(__name__)


class WhisperASR:
    """Wrapper for OpenAI Whisper ASR model."""

    def __init__(self, model_size: str = "base", device: str = "cpu"):
        """
        Initialize Whisper ASR model.
        
        Args:
            model_size: Model size ('tiny', 'base', 'small', 'medium', 'large')
            device: Device to run model on ('cpu' or 'cuda')
        """
        self.model_size = model_size
        self.device = device
        self.model = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self) -> None:
        """Load Whisper model from cache or download."""
        if not WHISPER_AVAILABLE:
            logger.warning("Whisper not available. Install with: pip install openai-whisper")
            return

        try:
            logger.info(f"Loading Whisper model: {self.model_size}")
            self.model = whisper.load_model(self.model_size, device=self.device)
            self.is_loaded = True
            logger.info(f"Whisper model loaded successfully on {self.device}")
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
            Dict with 'text', 'language', 'confidence' keys
        """
        if not self.is_loaded or self.model is None:
            return {
                "text": "",
                "language": language or "unknown",
                "confidence": 0.0,
                "error": "Whisper model not loaded"
            }

        try:
            if not Path(audio_path).exists():
                return {
                    "text": "",
                    "language": language or "unknown",
                    "confidence": 0.0,
                    "error": f"Audio file not found: {audio_path}"
                }

            result = self.model.transcribe(
                audio_path,
                language=language,
                task=task,
                verbose=False
            )

            return {
                "text": result.get("text", "").strip(),
                "language": result.get("language", language or "unknown"),
                "confidence": result.get("confidence", 0.0),
                "segments": result.get("segments", [])
            }
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return {
                "text": "",
                "language": language or "unknown",
                "confidence": 0.0,
                "error": str(e)
            }

    def get_supported_languages(self) -> list:
        """Return list of supported language codes."""
        return [
            "en", "zh", "de", "es", "fr", "ja", "ko", "pt", "ru", "ar", "hi"
        ]  # Common languages; Whisper supports 100+

    def unload(self) -> None:
        """Unload model from memory."""
        if self.model is not None:
            del self.model
            self.model = None
            self.is_loaded = False
            logger.info("Whisper model unloaded")
