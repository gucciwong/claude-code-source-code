"""Voice Activity Detection for streaming audio."""

import numpy as np
import logging
from typing import Tuple

logger = logging.getLogger(__name__)


class VADDetector:
    """
    Voice Activity Detection using WebRTC VAD.
    
    Detects speech vs silence in audio for auto-segmentation.
    """

    def __init__(
        self,
        sample_rate: int = 16000,
        frame_duration_ms: int = 20,
        aggressiveness: int = 2,
    ):
        """
        Initialize VAD detector.

        Args:
            sample_rate: Audio sample rate (16000, 32000, 48000)
            frame_duration_ms: Frame duration (10, 20, or 30)
            aggressiveness: Aggressiveness level (0-3, higher = more aggressive)
        """
        self.sample_rate = sample_rate
        self.frame_duration_ms = frame_duration_ms
        self.aggressiveness = aggressiveness

        # Calculate frame size
        self.frame_size = int(sample_rate * frame_duration_ms / 1000)

        # Try to import webrtcvad
        try:
            import webrtcvad
            self.vad = webrtcvad.Vad(aggressiveness)
            self.use_webrtc = True
            logger.info(f"WebRTC VAD initialized (aggressiveness={aggressiveness})")
        except ImportError:
            logger.warning(
                "webrtcvad not available, using simple energy-based VAD. "
                "Install with: pip install webrtcvad"
            )
            self.vad = None
            self.use_webrtc = False
            self._energy_threshold = self._calculate_energy_threshold()

    def is_speech(self, audio_chunk: np.ndarray) -> bool:
        """
        Detect if audio chunk contains speech.

        Args:
            audio_chunk: Audio samples (mono, float32 or int16)

        Returns:
            True if speech detected, False if silence
        """
        # Convert to float32 if needed
        if audio_chunk.dtype == np.int16:
            audio_chunk = audio_chunk.astype(np.float32) / 32768.0

        # Ensure correct length
        if len(audio_chunk) != self.frame_size:
            logger.debug(
                f"Adapting chunk size: {len(audio_chunk)} -> {self.frame_size}"
            )
            if len(audio_chunk) < self.frame_size:
                # Pad with zeros
                audio_chunk = np.pad(
                    audio_chunk, (0, self.frame_size - len(audio_chunk))
                )
            else:
                # Truncate
                audio_chunk = audio_chunk[: self.frame_size]

        if self.use_webrtc:
            return self._is_speech_webrtc(audio_chunk)
        else:
            return self._is_speech_energy(audio_chunk)

    def _is_speech_webrtc(self, audio_chunk: np.ndarray) -> bool:
        """Detect speech using WebRTC VAD."""
        # Convert float32 to int16
        audio_int16 = np.clip(audio_chunk * 32768, -32768, 32767).astype(np.int16)
        audio_bytes = audio_int16.tobytes()

        return self.vad.is_speech(audio_bytes, self.sample_rate)

    def _is_speech_energy(self, audio_chunk: np.ndarray) -> bool:
        """Simple energy-based speech detection (fallback)."""
        energy = np.mean(audio_chunk ** 2)
        return bool(energy > self._energy_threshold)

    def _calculate_energy_threshold(self) -> float:
        """Calculate energy threshold for simple VAD."""
        # Typical threshold for 16kHz audio
        return 0.001

    def detect_speech_segments(
        self, audio_data: np.ndarray
    ) -> list[Tuple[int, int, float]]:
        """
        Detect speech segments in audio.

        Args:
            audio_data: Full audio samples

        Returns:
            List of (start_frame, end_frame, confidence) tuples
        """
        segments = []
        current_segment_start = None
        confidence_sum = 0
        segment_frames = 0

        # Process in frames
        for i in range(0, len(audio_data) - self.frame_size, self.frame_size):
            frame = audio_data[i : i + self.frame_size]

            if self.is_speech(frame):
                if current_segment_start is None:
                    current_segment_start = i
                confidence_sum += 1.0
                segment_frames += 1
            else:
                if current_segment_start is not None:
                    # End of speech segment
                    confidence = confidence_sum / segment_frames
                    segments.append(
                        (current_segment_start, i, confidence)
                    )
                    current_segment_start = None
                    confidence_sum = 0
                    segment_frames = 0

        # Handle last segment
        if current_segment_start is not None:
            confidence = confidence_sum / segment_frames if segment_frames > 0 else 0.0
            segments.append((current_segment_start, len(audio_data), confidence))

        return segments

    def get_silence_duration_ms(
        self, audio_chunks: list[np.ndarray]
    ) -> float:
        """
        Calculate total silence duration in audio chunks.

        Args:
            audio_chunks: List of audio chunks

        Returns:
            Total silence duration in milliseconds
        """
        silence_frames = 0
        total_frames = 0

        for chunk in audio_chunks:
            # Process in frames
            for i in range(0, len(chunk) - self.frame_size, self.frame_size):
                frame = chunk[i : i + self.frame_size]
                if not self.is_speech(frame):
                    silence_frames += len(frame)
                total_frames += len(frame)

        return (silence_frames / self.sample_rate) * 1000 if total_frames > 0 else 0.0

    def reset(self) -> None:
        """Reset VAD detector state."""
        if self.use_webrtc:
            import webrtcvad
            self.vad = webrtcvad.Vad(self.aggressiveness)
