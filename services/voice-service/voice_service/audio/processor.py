"""Audio processing utilities using librosa."""

import logging
import os
from pathlib import Path
from typing import Optional, Tuple
import numpy as np

try:
    import librosa
    import soundfile as sf
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False

logger = logging.getLogger(__name__)


class AudioProcessor:
    """Audio processing utilities for voice service."""

    # Standard sampling rate for all processing
    SAMPLE_RATE = 16000
    
    # Target audio format
    TARGET_FORMAT = "wav"

    @staticmethod
    def load_audio(audio_path: str, sr: int = SAMPLE_RATE) -> Tuple[Optional[np.ndarray], int]:
        """
        Load audio file with librosa.
        
        Args:
            audio_path: Path to audio file
            sr: Target sample rate (resamples if needed)
            
        Returns:
            Tuple of (audio_array, sample_rate) or (None, 0) on error
        """
        if not LIBROSA_AVAILABLE:
            logger.error("librosa not available")
            return None, 0

        try:
            if not Path(audio_path).exists():
                logger.error(f"Audio file not found: {audio_path}")
                return None, 0

            y, sr_loaded = librosa.load(audio_path, sr=sr)
            logger.info(f"Loaded audio: {audio_path} (sr={sr_loaded}, duration={len(y)/sr_loaded:.2f}s)")
            return y, sr_loaded
        except Exception as e:
            logger.error(f"Failed to load audio: {e}")
            return None, 0

    @staticmethod
    def save_audio(audio_array: np.ndarray, output_path: str, sr: int = SAMPLE_RATE) -> bool:
        """
        Save audio array to file (WAV format).
        
        Args:
            audio_array: Audio samples as numpy array
            output_path: Output file path
            sr: Sample rate
            
        Returns:
            True if successful, False otherwise
        """
        if not LIBROSA_AVAILABLE:
            logger.error("librosa/soundfile not available")
            return False

        try:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            sf.write(output_path, audio_array, sr)
            logger.info(f"Saved audio: {output_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to save audio: {e}")
            return False

    @staticmethod
    def convert_to_wav(input_path: str, output_path: str, sr: int = SAMPLE_RATE) -> bool:
        """
        Convert any audio format to WAV at target sample rate.
        
        Args:
            input_path: Input audio file
            output_path: Output WAV file
            sr: Target sample rate
            
        Returns:
            True if successful
        """
        try:
            audio, sr_loaded = AudioProcessor.load_audio(input_path, sr=sr)
            if audio is None:
                return False
            return AudioProcessor.save_audio(audio, output_path, sr=sr_loaded)
        except Exception as e:
            logger.error(f"Conversion failed: {e}")
            return False

    @staticmethod
    def get_audio_duration(audio_path: str) -> float:
        """Get audio duration in seconds."""
        if not LIBROSA_AVAILABLE:
            return 0.0

        try:
            duration = librosa.get_duration(filename=audio_path)
            return round(duration, 2)
        except Exception as e:
            logger.error(f"Failed to get duration: {e}")
            return 0.0

    @staticmethod
    def normalize_audio(audio_array: np.ndarray, target_db: float = -20.0) -> np.ndarray:
        """
        Normalize audio to target loudness level.
        
        Args:
            audio_array: Audio samples
            target_db: Target dB level
            
        Returns:
            Normalized audio array
        """
        try:
            # Compute RMS
            rms = np.sqrt(np.mean(audio_array ** 2))
            if rms == 0:
                return audio_array

            # Target amplitude from dB
            target_amplitude = 10 ** (target_db / 20.0)
            scale = target_amplitude / rms

            return np.clip(audio_array * scale, -1.0, 1.0)
        except Exception as e:
            logger.error(f"Normalization failed: {e}")
            return audio_array

    @staticmethod
    def trim_silence(audio_array: np.ndarray, top_db: float = 40) -> np.ndarray:
        """
        Trim leading/trailing silence from audio.
        
        Args:
            audio_array: Audio samples
            top_db: Threshold in dB
            
        Returns:
            Trimmed audio array
        """
        if not LIBROSA_AVAILABLE:
            return audio_array

        try:
            trimmed, _ = librosa.effects.trim(audio_array, top_db=top_db)
            return trimmed
        except Exception as e:
            logger.error(f"Trim failed: {e}")
            return audio_array

    @staticmethod
    def detect_speech_activity(audio_array: np.ndarray, sr: int = SAMPLE_RATE, 
                              energy_threshold: float = 0.02) -> Tuple[bool, float]:
        """
        Simple speech activity detection based on energy threshold.
        
        Args:
            audio_array: Audio samples
            sr: Sample rate
            energy_threshold: Threshold for voice detection
            
        Returns:
            Tuple of (has_speech, confidence)
        """
        try:
            # Compute RMS energy
            frame_length = sr // 100  # 10ms frames
            energy = np.array([
                np.sqrt(np.mean(audio_array[i:i+frame_length]**2))
                for i in range(0, len(audio_array), frame_length)
            ])

            mean_energy = np.mean(energy)
            has_speech = mean_energy > energy_threshold
            confidence = min(mean_energy / energy_threshold, 1.0)

            return has_speech, round(confidence, 2)
        except Exception as e:
            logger.error(f"SAD failed: {e}")
            return False, 0.0
