"""VibeVoice Service - Voice I/O for VSCode + Desktop."""

__version__ = "0.1.0"
__author__ = "Sovereign Coder"

from voice_service.models.whisper import WhisperASR
from voice_service.models.tts import GTTSAPI
from voice_service.audio.processor import AudioProcessor

__all__ = ["WhisperASR", "GTTSAPI", "AudioProcessor"]
