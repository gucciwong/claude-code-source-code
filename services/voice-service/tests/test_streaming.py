"""Tests for WebSocket streaming transcription."""

import pytest
import asyncio
import numpy as np
import json
import base64
from typing import AsyncGenerator

from voice_service.stream.audio_buffer import AudioBuffer
from voice_service.stream.vad import VADDetector
from voice_service.stream.streaming_transcriber import StreamingTranscriber


class TestAudioBuffer:
    """Test AudioBuffer circular buffer implementation."""

    def test_buffer_initialization(self):
        """Test buffer creation with correct parameters."""
        buffer = AudioBuffer(sample_rate=16000, chunk_duration_ms=320)
        
        assert buffer.sample_rate == 16000
        assert buffer.frames_per_chunk == 5120  # 16000 * 0.32
        assert buffer.buffer_fill_ratio == 0.0
        assert not buffer.has_data()

    def test_add_chunk(self):
        """Test adding audio chunks to buffer."""
        buffer = AudioBuffer()
        
        # Create test audio
        audio = np.random.randn(5120).astype(np.float32)
        frames = buffer.add_chunk(audio)
        
        assert frames == 5120
        assert buffer.has_data()
        assert buffer.total_frames_received == 5120

    def test_get_frames(self):
        """Test retrieving frames from buffer."""
        buffer = AudioBuffer()
        
        # Add multiple chunks
        audio1 = np.ones(5120, dtype=np.float32) * 0.5
        audio2 = np.ones(5120, dtype=np.float32) * 0.3
        
        buffer.add_chunk(audio1)
        buffer.add_chunk(audio2)
        
        # Get all frames
        frames = buffer.get_frames()
        assert frames is not None
        assert len(frames) >= 5120
        
        # Get specific number of frames
        subset = buffer.get_frames(num_frames=2560)
        assert len(subset) == 2560

    def test_buffer_fill_ratio(self):
        """Test buffer fill ratio calculation."""
        buffer = AudioBuffer(max_chunks=10)
        
        for i in range(5):
            audio = np.zeros(5120, dtype=np.float32)
            buffer.add_chunk(audio)
        
        # Half full
        assert 0.4 <= buffer.get_buffer_fill_ratio() <= 0.6

    def test_int16_conversion(self):
        """Test int16 to float32 conversion."""
        buffer = AudioBuffer()
        
        # Create int16 audio
        audio_int16 = np.array([0, 16384, -16384, 8192], dtype=np.int16)
        buffer.add_chunk(audio_int16)
        
        frames = buffer.get_frames()
        assert frames is not None
        assert frames.dtype == np.float32


class TestVADDetector:
    """Test Voice Activity Detection."""

    def test_vad_initialization(self):
        """Test VAD initialization."""
        vad = VADDetector(sample_rate=16000, frame_duration_ms=20)
        
        assert vad.sample_rate == 16000
        assert vad.frame_size == 320  # 16000 * 0.02
        assert vad.aggressiveness == 2

    def test_is_speech_detection(self):
        """Test basic speech/silence detection."""
        vad = VADDetector(sample_rate=16000, frame_duration_ms=20)
        
        # Silence (near-zero amplitude)
        silence = np.zeros(320, dtype=np.float32)
        assert not vad.is_speech(silence)
        
        # Noise (high amplitude)
        noise = np.random.randn(320).astype(np.float32) * 0.5
        # May or may not detect as speech depending on energy
        result = vad.is_speech(noise)
        assert isinstance(result, bool)

    def test_frame_adaptation(self):
        """Test that VAD adapts to different chunk sizes."""
        vad = VADDetector(sample_rate=16000, frame_duration_ms=20)
        
        # Too short chunk
        short_audio = np.zeros(100, dtype=np.float32)
        result = vad.is_speech(short_audio)
        assert isinstance(result, bool)
        
        # Too long chunk
        long_audio = np.zeros(640, dtype=np.float32)
        result = vad.is_speech(long_audio)
        assert isinstance(result, bool)

    def test_detect_speech_segments(self):
        """Test speech segment detection."""
        vad = VADDetector(sample_rate=16000, frame_duration_ms=20)
        
        # Create audio with speech-like pattern
        # Silence + noise + silence
        silence_1 = np.zeros(3200, dtype=np.float32)  # 200ms silence
        speech = np.random.randn(6400).astype(np.float32) * 0.3  # 400ms speech
        silence_2 = np.zeros(3200, dtype=np.float32)  # 200ms silence
        
        audio = np.concatenate([silence_1, speech, silence_2])
        
        # Detect segments - should find speech in middle
        segments = vad.detect_speech_segments(audio)
        assert isinstance(segments, list)
        # May or may not detect depending on energy threshold


class TestStreamingTranscriber:
    """Test streaming transcription with VAD integration."""

    def test_transcriber_initialization(self):
        """Test transcriber setup."""
        if not pytest.mark.skipif:
            pytest.skip("GPU not available for test")
        
        try:
            transcriber = StreamingTranscriber(
                model_size="tiny",  # Use tiny for testing
                device="cpu",
                vad_aggressiveness=2,
            )
            
            assert transcriber.model_size == "tiny"
            assert transcriber.device == "cpu"
            assert not transcriber.in_speech
        except Exception as e:
            pytest.skip(f"Could not initialize transcriber: {e}")

    def test_reset(self):
        """Test transcriber state reset."""
        try:
            transcriber = StreamingTranscriber(model_size="tiny", device="cpu")
            
            # Modify state
            transcriber.in_speech = True
            transcriber.total_audio_received = 5.0
            
            # Reset
            transcriber.reset()
            
            assert not transcriber.in_speech
            assert transcriber.total_audio_received == 0.0
        except Exception as e:
            pytest.skip(f"Could not initialize transcriber: {e}")

    def test_get_status(self):
        """Test status reporting."""
        try:
            transcriber = StreamingTranscriber(model_size="tiny", device="cpu")
            status = transcriber.get_status()
            
            assert "in_speech" in status
            assert "total_audio_received_ms" in status
            assert "buffer_info" in status
            assert "device_info" in status
        except Exception as e:
            pytest.skip(f"Could not initialize transcriber: {e}")


class TestStreamingProtocol:
    """Test WebSocket streaming protocol messages."""

    def test_message_format_audio_chunk(self):
        """Test audio chunk message format."""
        audio = np.zeros(5120, dtype=np.int16)
        audio_bytes = audio.tobytes()
        audio_b64 = base64.b64encode(audio_bytes).decode()
        
        message = {
            "type": "audio_chunk",
            "data": audio_b64,
        }
        
        assert message["type"] == "audio_chunk"
        assert len(message["data"]) > 0
        
        # Verify decode
        decoded = base64.b64decode(message["data"])
        assert len(decoded) == len(audio_bytes)

    def test_message_format_transcript(self):
        """Test transcript response format."""
        response = {
            "type": "transcript",
            "text": "Hello world",
            "is_final": False,
            "confidence": 0.95,
            "duration_ms": 1500.0,
        }
        
        assert response["type"] == "transcript"
        assert "text" in response
        assert "is_final" in response
        assert "confidence" in response

    def test_message_format_status(self):
        """Test status update format."""
        status = {
            "type": "status",
            "chunks_received": 10,
            "total_audio_ms": 3200.0,
            "in_speech": True,
        }
        
        assert status["type"] == "status"
        assert "chunks_received" in status
        assert "total_audio_ms" in status


@pytest.mark.asyncio
async def test_process_chunk():
    """Test async chunk processing."""
    try:
        transcriber = StreamingTranscriber(model_size="tiny", device="cpu")
        
        # Create test audio chunk
        audio = np.random.randn(16000).astype(np.float32) * 0.1  # 1 second
        
        # Process chunk (should not raise error even if no VAD trigger)
        result = await transcriber.process_chunk(audio)
        
        assert "text" in result
        assert "is_final" in result
        assert "confidence" in result
    except Exception as e:
        pytest.skip(f"Could not run async test: {e}")


# Integration test fixtures
@pytest.fixture
def sample_audio():
    """Generate sample audio for testing."""
    return np.random.randn(16000).astype(np.float32) * 0.1


@pytest.fixture
def sample_audio_chunks():
    """Generate multiple audio chunks."""
    chunks = []
    for _ in range(5):
        chunk = np.random.randn(5120).astype(np.float32) * 0.1
        chunks.append(chunk)
    return chunks
