"""Real-time streaming transcription with partial results."""

import asyncio
import time
import logging
from typing import AsyncGenerator, Optional, Dict, Any
import numpy as np

from .audio_buffer import AudioBuffer
from .vad import VADDetector
from ..models.whisper import WhisperASR
from ..config.device_config import DeviceConfig

logger = logging.getLogger(__name__)


class StreamingTranscriber:
    """Streaming transcription with VAD-based segmentation and partial results."""

    def __init__(
        self,
        model_size: str = "base",
        device: str = "auto",
        compute_type: str = "default",
        vad_aggressiveness: int = 2,
        silence_threshold_ms: float = 800.0,
        min_utterance_duration_ms: float = 500.0,
    ):
        """
        Initialize streaming transcriber.

        Args:
            model_size: Whisper model size (tiny, base, small, medium, large)
            device: Device to use (auto, cuda, cpu)
            compute_type: Compute type (default, float16, int8)
            vad_aggressiveness: VAD aggressiveness (0-3)
            silence_threshold_ms: Duration to wait for silence before finalizing
            min_utterance_duration_ms: Minimum utterance duration
        """
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.silence_threshold_ms = silence_threshold_ms
        self.min_utterance_duration_ms = min_utterance_duration_ms

        # Initialize components
        self.asr_model = WhisperASR(
            model_size=model_size, device=device, compute_type=compute_type
        )
        self.audio_buffer = AudioBuffer(sample_rate=16000, chunk_duration_ms=320)
        self.vad = VADDetector(sample_rate=16000, frame_duration_ms=20, aggressiveness=vad_aggressiveness)

        # State tracking
        self.last_speech_time = 0.0
        self.utterance_start_time = 0.0
        self.in_speech = False
        self.total_audio_received = 0.0

        logger.info(
            f"StreamingTranscriber initialized: model={model_size}, "
            f"device={device}, vad_aggressiveness={vad_aggressiveness}"
        )

    async def process_chunk(self, audio_chunk: np.ndarray) -> Dict[str, Any]:
        """
        Process audio chunk and return partial transcription if available.

        Args:
            audio_chunk: Audio samples (mono, float32 or int16)

        Returns:
            Dict with keys:
                - 'text': Partial or final transcript
                - 'is_final': True if segment is finalized
                - 'confidence': Confidence score
                - 'start_time': Segment start time
                - 'duration': Segment duration
        """
        current_time = time.time()

        # Add chunk to buffer
        frames_added = self.audio_buffer.add_chunk(audio_chunk)
        self.total_audio_received = (frames_added / 16000.0)  # Convert to seconds

        # Detect speech in chunk
        is_speech = self.vad.is_speech(audio_chunk)

        result = {
            "text": "",
            "is_final": False,
            "confidence": 0.0,
            "start_time": self.total_audio_received,
            "duration": 0.0,
        }

        # Track speech state
        if is_speech:
            if not self.in_speech:
                self.in_speech = True
                self.utterance_start_time = current_time
                logger.debug("Speech detected, utterance started")

            self.last_speech_time = current_time
        else:
            # Check if silence has exceeded threshold
            if self.in_speech:
                silence_duration = (current_time - self.last_speech_time) * 1000

                if silence_duration > self.silence_threshold_ms:
                    # Finalize utterance
                    result = await self._finalize_utterance()
                    self.in_speech = False
                    self.audio_buffer.clear()

        return result

    async def _finalize_utterance(self) -> Dict[str, Any]:
        """Finalize and transcribe current utterance."""
        audio_data = self.audio_buffer.get_frames()

        if audio_data is None or len(audio_data) == 0:
            return {
                "text": "",
                "is_final": False,
                "confidence": 0.0,
                "start_time": 0.0,
                "duration": 0.0,
            }

        # Check minimum duration
        duration_ms = (len(audio_data) / 16000.0) * 1000
        if duration_ms < self.min_utterance_duration_ms:
            logger.debug(f"Utterance too short: {duration_ms}ms, skipping")
            return {
                "text": "",
                "is_final": False,
                "confidence": 0.0,
                "start_time": 0.0,
                "duration": duration_ms,
            }

        # Transcribe
        try:
            start_time = time.time()
            transcript = await asyncio.to_thread(
                self.asr_model.transcribe, audio_data
            )
            inference_time = time.time() - start_time

            logger.info(
                f"Transcribed {duration_ms:.0f}ms audio in {inference_time:.2f}s: "
                f"'{transcript['text'][:50]}...'"
            )

            return {
                "text": transcript["text"],
                "is_final": True,
                "confidence": transcript.get("confidence", 0.92),
                "start_time": self.utterance_start_time,
                "duration": duration_ms,
                "inference_time_ms": inference_time * 1000,
            }
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return {
                "text": "",
                "is_final": False,
                "confidence": 0.0,
                "start_time": 0.0,
                "duration": duration_ms,
                "error": str(e),
            }

    async def stream_transcribe(
        self, audio_chunks: AsyncGenerator[np.ndarray, None]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream transcription with partial results.

        Args:
            audio_chunks: Async generator yielding audio chunks

        Yields:
            Dict with transcription results
        """
        logger.info("Starting streaming transcription")

        try:
            async for chunk in audio_chunks:
                result = await self.process_chunk(chunk)

                if result["text"]:  # Yield non-empty results
                    yield result

                # Small delay to avoid busy waiting
                await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Streaming transcription error: {e}")
            yield {
                "text": "",
                "is_final": False,
                "confidence": 0.0,
                "error": str(e),
            }
        finally:
            # Finalize any remaining audio
            if self.in_speech:
                final_result = await self._finalize_utterance()
                if final_result["text"]:
                    yield final_result
            logger.info("Streaming transcription completed")

    def reset(self) -> None:
        """Reset transcriber state."""
        self.audio_buffer.clear()
        self.vad.reset()
        self.last_speech_time = 0.0
        self.utterance_start_time = 0.0
        self.in_speech = False
        self.total_audio_received = 0.0
        logger.debug("StreamingTranscriber reset")

    def get_status(self) -> Dict[str, Any]:
        """Get current streaming status."""
        return {
            "in_speech": self.in_speech,
            "total_audio_received_ms": self.total_audio_received * 1000,
            "buffer_info": self.audio_buffer.get_buffer_info(),
            "device_info": self.asr_model.get_device_info(),
        }
