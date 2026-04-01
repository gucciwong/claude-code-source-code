"""Audio buffer management for streaming transcription."""

import numpy as np
from collections import deque
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class AudioBuffer:
    """Circular buffer for streaming audio chunks with VAD integration."""

    def __init__(
        self,
        sample_rate: int = 16000,
        chunk_duration_ms: int = 320,
        buffer_duration_ms: int = 4000,
    ):
        """
        Initialize audio buffer.

        Args:
            sample_rate: Audio sample rate (default 16kHz)
            chunk_duration_ms: Duration of each chunk (default 320ms)
            buffer_duration_ms: Total buffer duration (default 4s)
        """
        self.sample_rate = sample_rate
        self.chunk_duration_ms = chunk_duration_ms
        self.buffer_duration_ms = buffer_duration_ms

        # Calculate frames per chunk and max chunks
        self.frames_per_chunk = int(sample_rate * chunk_duration_ms / 1000)
        self.max_chunks = int(buffer_duration_ms / chunk_duration_ms)

        # Use deque for efficient circular buffer
        self.buffer: deque = deque(maxlen=self.max_chunks)
        self.total_frames_received = 0

        logger.info(
            f"AudioBuffer initialized: "
            f"{self.frames_per_chunk} frames/chunk, "
            f"max {self.max_chunks} chunks"
        )

    def add_chunk(self, audio_data: np.ndarray) -> int:
        """
        Add audio chunk to buffer.

        Args:
            audio_data: Audio samples (mono, float32 or int16)

        Returns:
            Total frames received so far
        """
        # Convert int16 to float32 if needed
        if audio_data.dtype == np.int16:
            audio_data = audio_data.astype(np.float32) / 32768.0

        # Ensure 1D array
        if len(audio_data.shape) > 1:
            audio_data = audio_data.squeeze()

        # Add to buffer
        self.buffer.append(audio_data)
        self.total_frames_received += len(audio_data)

        return self.total_frames_received

    def get_frames(self, num_frames: Optional[int] = None) -> Optional[np.ndarray]:
        """
        Get audio frames from buffer.

        Args:
            num_frames: Number of frames to retrieve. If None, returns all buffered frames.

        Returns:
            Audio frames as float32 numpy array, or None if buffer empty
        """
        if not self.buffer:
            return None

        # Concatenate all chunks
        audio = np.concatenate(list(self.buffer))

        if num_frames is None:
            return audio

        # Return only requested frames
        if len(audio) >= num_frames:
            return audio[:num_frames]

        return audio

    def clear(self) -> None:
        """Clear buffer."""
        self.buffer.clear()
        logger.debug("AudioBuffer cleared")

    def get_buffer_fill_ratio(self) -> float:
        """Get buffer fill ratio (0.0 to 1.0)."""
        return len(self.buffer) / self.max_chunks if self.max_chunks > 0 else 0.0

    def get_buffer_duration_ms(self) -> float:
        """Get current buffered duration in milliseconds."""
        total_frames = sum(len(chunk) for chunk in self.buffer)
        return (total_frames / self.sample_rate) * 1000

    def get_buffer_info(self) -> dict:
        """Get detailed buffer information."""
        total_frames = sum(len(chunk) for chunk in self.buffer)
        return {
            "chunks_in_buffer": len(self.buffer),
            "max_chunks": self.max_chunks,
            "total_frames": total_frames,
            "buffer_duration_ms": (total_frames / self.sample_rate) * 1000,
            "fill_ratio": self.get_buffer_fill_ratio(),
            "total_frames_received": self.total_frames_received,
        }

    def is_full(self) -> bool:
        """Check if buffer is at max capacity."""
        return len(self.buffer) >= self.max_chunks

    def has_data(self) -> bool:
        """Check if buffer has any data."""
        return len(self.buffer) > 0
