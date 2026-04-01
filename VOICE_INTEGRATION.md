# VibeVoice Integration: Desktop App + Voice Service

This document explains how the desktop app connects to the voice service backend for transcription and synthesis.

## Architecture

```
Desktop App (React + TypeScript)
    ↓
useVoiceService hook (API client)
    ↓
FastAPI Voice Service (Python)
    ├─ /transcribe → Whisper ASR
    ├─ /synthesize → Google TTS
    └─ /health → Service status
```

## Getting Started

### 1. Start the Voice Service

**Option A: Docker Compose (Recommended)**

```bash
# Start all services (voice-service + redis)
docker-compose up -d

# View logs
docker-compose logs -f voice-service

# Stop services
docker-compose down
```

**Option B: Local Python**

```bash
# Navigate to voice service
cd services/voice-service

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run service
python -m uvicorn main:app --reload --port 8000
```

The service will be available at `http://localhost:8000`

### 2. Verify Service Health

```bash
# Check health
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "ok",
#   "version": "0.1.0",
#   "asr_loaded": true,
#   "tts_loaded": true,
#   "gpu_available": false
# }
```

### 3. Run Desktop App Tests

```bash
# From apps/desktop
npm test

# Or run E2E tests specifically
npm test -- useVoiceService.e2e.test.ts
```

## API Endpoints

### POST /transcribe
Convert audio to text (ASR - Automatic Speech Recognition)

**Request:**
```bash
curl -X POST http://localhost:8000/transcribe \
  -F "file=@audio.wav" \
  -F "language=en"
```

**Response:**
```json
{
  "text": "hello world",
  "language": "en",
  "confidence": 0.95,
  "duration": 2.5
}
```

### POST /synthesize
Convert text to audio (TTS - Text-to-Speech)

**Request:**
```bash
curl -X POST http://localhost:8000/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en"}'
```

**Response:**
```json
{
  "audio_url": "data:audio/wav;base64,...",
  "duration": 1.5
}
```

### GET /health
Service health check

**Request:**
```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "asr_loaded": true,
  "tts_loaded": true,
  "gpu_available": false,
  "memory_usage_percent": 45.2
}
```

## Desktop App Integration

The desktop app uses the `useVoiceService` hook to interact with the backend:

```typescript
import { useVoiceService } from '@/hooks/useVoiceService'

function MyComponent() {
  const { transcribeAudio, synthesizeText, checkServiceHealth } = useVoiceService()

  // Transcribe audio
  const handleRecord = async (audioBlob: Blob) => {
    const result = await transcribeAudio(audioBlob, 'en')
    if (result) {
      console.log('Transcribed:', result.text)
    }
  }

  // Synthesize response
  const handleSpeak = async (text: string) => {
    const result = await synthesizeText(text, 'en')
    if (result) {
      const audio = new Audio(result.audio_url)
      audio.play()
    }
  }

  return (
    <div>
      {/* UI components */}
    </div>
  )
}
```

## Configuration

### Desktop App
- Voice service URL: `http://localhost:8000` (hardcoded in useVoiceService)
- Can be changed by editing `VOICE_SERVICE_URL` constant

### Voice Service
Environment variables in `.env`:

```bash
# Server
PORT=8000
LOG_LEVEL=INFO

# Audio Processing
VAD_AGGRESSIVENESS=2           # 0-3 (higher = more aggressive voice detection)
SILENCE_THRESHOLD_MS=800       # Duration of silence before finalizing
MIN_UTTERANCE_DURATION_MS=500  # Minimum duration to transcribe

# Models
WHISPER_MODEL_SIZE=base        # tiny, base, small, medium, large
TTS_DEFAULT_LANG=en

# Optimization
DEVICE=cpu                      # cpu, cuda, mps, auto
ENABLE_GPU_OPTIMIZATION=false   # Use float16 for faster inference
```

## Testing

### Unit Tests
```bash
npm test                        # All tests
npm test -- useVoiceService.test.ts   # Hook tests only
```

### E2E Tests (requires running voice service)
```bash
# Start voice service first
docker-compose up -d voice-service

# Run E2E tests
npm test -- useVoiceService.e2e.test.ts
```

### Manual Testing with cURL

**Transcribe:**
```bash
# Create test audio (silence)
python3 -c "
import wave
import struct

with wave.open('test.wav', 'w') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(16000)
    # Write 1 second of silence
    f.writeframes(struct.pack('<H', 0) * 16000)
"

# Transcribe
curl -X POST http://localhost:8000/transcribe \
  -F "file=@test.wav" \
  -F "language=en"
```

**Synthesize:**
```bash
curl -X POST http://localhost:8000/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en"}' \
  --output response.wav
```

## Performance Considerations

### Model Loading
- ASR (Whisper) loads on first request (~500ms)
- TTS loads on first request (~300ms)
- Subsequent requests are cached in memory

### Audio Format
- Input: WAV, MP3, OGG (librosa handles conversion)
- Output: WAV (PCM 16-bit, 24kHz)
- Sample rate: 16kHz for ASR, 24kHz for TTS

### GPU Acceleration
- Requires NVIDIA CUDA toolkit
- Set `DEVICE=cuda` in .env
- ~3-5x faster transcription and synthesis

## Troubleshooting

### Service won't start
```
Error: Address already in use
```
→ Change PORT in .env or kill existing process on port 8000

### Transcription failing
```
Error: Device not found (CUDA)
```
→ Set `DEVICE=cpu` in .env to use CPU instead

### Long latency
```
First request takes 5+ seconds
```
→ Normal - models are loading on first use. Subsequent requests are fast.

### Out of memory
```
CUDA out of memory error
```
→ Use smaller model: `WHISPER_MODEL_SIZE=tiny` or `DEVICE=cpu`

## Development

### Adding new endpoints
Edit `services/voice-service/main.py` and:
1. Add FastAPI route
2. Update `useVoiceService` hook in desktop app
3. Add tests to `useVoiceService.e2e.test.ts`
4. Document in this file

### Running with hot reload
```bash
python -m uvicorn main:app --reload --port 8000
```

### Debugging
```bash
# Enable verbose logging
LOG_LEVEL=DEBUG python -m uvicorn main:app --port 8000

# Check service metrics (if Prometheus enabled)
curl http://localhost:8000/metrics
```

## Resources

- [VibeVoice GitHub](https://github.com/microsoft/VibeVoice)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Whisper ASR](https://openai.com/research/whisper)
