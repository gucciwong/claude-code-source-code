"""Text-to-Speech (TTS) using gTTS with fallback options."""

import logging
import os
from pathlib import Path
from typing import Optional

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False

logger = logging.getLogger(__name__)


class GTTSAPI:
    """Wrapper for Google Text-to-Speech."""

    def __init__(self, lang: str = "en", slow: bool = False):
        """
        Initialize gTTS synthesizer.
        
        Args:
            lang: Language code (e.g., 'en', 'zh-CN', 'fr')
            slow: Use slower speech rate
        """
        self.lang = lang
        self.slow = slow
        self.is_loaded = GTTS_AVAILABLE and self._check_connectivity()

    def _check_connectivity(self) -> bool:
        """Check if gTTS can connect to Google API."""
        if not GTTS_AVAILABLE:
            return False
        try:
            # Test connectivity by attempting a minimal synthesis
            test_tts = gTTS(text="test", lang=self.lang)
            logger.info("gTTS connectivity verified")
            return True
        except Exception as e:
            logger.warning(f"gTTS connectivity check failed: {e}")
            return False

    def synthesize(self, text: str, output_path: str) -> dict:
        """
        Synthesize text to speech and save as audio file.
        
        Args:
            text: Text to synthesize
            output_path: Path where to save audio (MP3)
            
        Returns:
            Dict with 'success', 'path', 'duration' (approx) and optional error
        """
        if not self.is_loaded:
            return {
                "success": False,
                "path": "",
                "duration": 0,
                "error": "gTTS not available or offline"
            }

        try:
            if not text or not text.strip():
                return {
                    "success": False,
                    "path": "",
                    "duration": 0,
                    "error": "Text is empty"
                }

            # Ensure output directory exists
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)

            # Create gTTS object and save
            tts = gTTS(text=text, lang=self.lang, slow=self.slow)
            tts.save(output_path)

            # Estimate duration (rough: ~150 words per minute)
            word_count = len(text.split())
            estimated_duration = (word_count / 150) * 60
            if self.slow:
                estimated_duration *= 1.5

            return {
                "success": True,
                "path": str(output_file.absolute()),
                "duration": round(estimated_duration, 2),
                "lang": self.lang
            }

        except Exception as e:
            logger.error(f"TTS synthesis error: {e}")
            return {
                "success": False,
                "path": "",
                "duration": 0,
                "error": str(e)
            }

    def get_supported_languages(self) -> dict:
        """Return dictionary of supported languages."""
        return {
            "en": "English",
            "zh-CN": "Simplified Chinese",
            "zh-TW": "Traditional Chinese",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "ja": "Japanese",
            "ko": "Korean",
            "ru": "Russian",
            "ar": "Arabic",
        }

    def set_language(self, lang: str) -> bool:
        """Set target language."""
        self.lang = lang
        return self._check_connectivity()
