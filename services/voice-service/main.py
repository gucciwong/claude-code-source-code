"""FastAPI voice service for VSCode + Desktop."""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
import tempfile
import json
import numpy as np
import asyncio

# Load environment
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Import model wrappers
from voice_service.models.whisper import WhisperASR
from voice_service.models.tts import GTTSAPI
from voice_service.audio.processor import AudioProcessor
from voice_service.config.device_config import DeviceConfig
from voice_service.stream.streaming_transcriber import StreamingTranscriber

# Import Redis and session management
from voice_service.config.redis_config import redis_client
from voice_service.cache import session_store, model_cache
from voice_service.health.checks import router as health_router

# Import metrics and monitoring
from voice_service.metrics import attach_metrics_middleware, MetricsTracker, registry
from prometheus_client import generate_latest

# FastAPI app
app = FastAPI(
    title="Sovereign Voice Service",
    description="Voice I/O service for VSCode + Desktop",
    version="0.1.0"
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS config
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:5175,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5175"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include health check router
app.include_router(health_router)

# Attach metrics middleware for automatic collection
attach_metrics_middleware(app)

# Instance ID for load balancing tracking
INSTANCE_ID = os.getenv("INSTANCE_ID", "instance-1")

# Model instances (singleton pattern)
asr_model: Optional[WhisperASR] = None
tts_model: Optional[GTTSAPI] = None
streaming_transcriber: Optional[StreamingTranscriber] = None


# Models
class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    asr_loaded: bool
    tts_loaded: bool
    audio_capable: bool
    version: str


class TranscribeResponse(BaseModel):
    """Transcription response."""
    text: str
    language: str
    confidence: float
    error: Optional[str] = None


class SpeakResponse(BaseModel):
    """TTS response."""
    success: bool
    path: str
    duration: float
    error: Optional[str] = None


class SynthesizeRequest(BaseModel):
    """JSON request body for /synthesize endpoint."""
    text: str
    language: str = "en"


class SynthesizeResponse(BaseModel):
    """JSON response for /synthesize endpoint (desktop client format)."""
    audio_url: str
    duration: float


# Lifespan event handlers
@app.on_event("startup")
async def startup():
    """Initialize models on startup."""
    global asr_model, tts_model, streaming_transcriber
    
    logger.info(f"Starting VibeVoice service instance: {INSTANCE_ID}")
    logger.info("Initializing models...")
    
    # Initialize Redis and session management
    try:
        redis_health = redis_client.health_check()
        if redis_health.get("connected"):
            logger.info("Redis connected successfully")
            
            # Register this instance with model cache
            max_memory_gb = float(os.getenv("MAX_MODEL_MEMORY_GB", "8"))
            model_cache.register_instance(INSTANCE_ID, max_memory_gb)
            logger.info(f"Registered instance {INSTANCE_ID} with {max_memory_gb}GB capacity")
        else:
            logger.warning("Redis not available - running in single-instance mode")
    except Exception as e:
        logger.warning(f"Failed to initialize Redis: {e}")
    
    # Log device info
    device_info = DeviceConfig.get_device_info()
    logger.info(f"Device Info: {device_info}")
    
    try:
        # Auto-detect best device (CUDA → MPS → CPU)
        device = DeviceConfig.get_device_with_fallback(
            os.getenv("DEVICE", "auto")
        )
        asr_model = WhisperASR(
            model_size=os.getenv("WHISPER_MODEL_SIZE", "base"),
            device=device,
            compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "default")
        )
        logger.info(f"ASR model loaded: {asr_model.is_loaded} on {device}")
        logger.info(f"Model device info: {asr_model.get_device_info()}")
    except Exception as e:
        logger.error(f"Failed to load ASR model: {e}")

    try:
        tts_model = GTTSAPI(
            lang=os.getenv("TTS_DEFAULT_LANG", "en")
        )
        logger.info(f"TTS model initialized: {tts_model.is_loaded}")
    except Exception as e:
        logger.error(f"Failed to initialize TTS: {e}")
    
    try:
        # Initialize streaming transcriber for WebSocket
        streaming_transcriber = StreamingTranscriber(
            model_size=os.getenv("WHISPER_MODEL_SIZE", "base"),
            device=device,
            compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "default"),
            vad_aggressiveness=int(os.getenv("VAD_AGGRESSIVENESS", "2")),
            silence_threshold_ms=float(os.getenv("SILENCE_THRESHOLD_MS", "800")),
            min_utterance_duration_ms=float(os.getenv("MIN_UTTERANCE_DURATION_MS", "500"))
        )
        logger.info("Streaming transcriber initialized for WebSocket support")
    except Exception as e:
        logger.error(f"Failed to initialize streaming transcriber: {e}")


@app.on_event("shutdown")
async def shutdown():
    """Clean up on shutdown."""
    global asr_model
    
    if asr_model:
        asr_model.unload()
        logger.info("ASR model unloaded")
    
    # Clean up Redis connection
    try:
        redis_client.close()
        logger.info("Redis connection closed")
    except:
        pass
    
    logger.info(f"Instance {INSTANCE_ID} shutting down")


# Routes - Metrics
@app.get("/metrics")
@limiter.limit("30/minute")
async def metrics(request: Request):
    """Prometheus metrics endpoint."""
    return generate_latest(registry)


# Routes
@app.get("/health")
@limiter.limit("60/minute")
async def health_check(request: Request):
    """Health check endpoint with device information."""
    device_info = DeviceConfig.get_device_info()
    
    response = {
        "status": "healthy",
        "version": "0.2.0",
        "models": {
            "asr_loaded": bool(asr_model and asr_model.is_loaded),
            "tts_loaded": bool(tts_model and tts_model.is_loaded),
        },
        "device": device_info
    }
    
    if asr_model and asr_model.is_loaded:
        response["models"]["asr_info"] = asr_model.get_device_info()
    
    return response


# Backward-compatible aliases expected by some clients/tests.
@app.post("/api/voice/transcribe", response_model=TranscribeResponse)
@limiter.limit("10/minute")
async def transcribe_api_alias(request: Request, file: UploadFile = File(...), language: Optional[str] = None):
    return await transcribe(request=request, file=file, language=language)


@app.post("/transcribe", response_model=TranscribeResponse)
@limiter.limit("10/minute")
async def transcribe(request: Request, file: UploadFile = File(...), language: Optional[str] = None):
    """Transcribe audio to text."""
    global asr_model
    
    if not asr_model or not asr_model.is_loaded:
        raise HTTPException(status_code=503, detail="ASR model not available")

    temp_file = None
    try:
        logger.info(f"Transcribe request: {file.filename}")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            contents = await file.read()
            tmp.write(contents)
            temp_file = tmp.name

        # Convert to WAV if needed
        wav_file = temp_file
        if not temp_file.endswith(".wav"):
            wav_file = temp_file + ".wav"
            AudioProcessor.convert_to_wav(temp_file, wav_file)

        # Transcribe
        result = asr_model.transcribe(wav_file, language=language)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        return TranscribeResponse(
            text=result["text"],
            language=result["language"],
            confidence=float(result.get("confidence", 0.0))
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_file and Path(temp_file).exists():
            try:
                os.remove(temp_file)
            except:
                pass


@app.post("/speak", response_model=SpeakResponse)
@limiter.limit("10/minute")
async def speak(request: Request, text: str = Form(...), language: str = Form("en")):
    """Synthesize text to speech."""
    global tts_model
    
    if not tts_model or not tts_model.is_loaded:
        raise HTTPException(status_code=503, detail="TTS model not available")

    try:
        logger.info(f"TTS request: {text[:50]}...")
        
        # Set language if different
        if language != tts_model.lang:
            tts_model.set_language(language)

        # Generate output path
        output_dir = Path(os.getenv("TTS_OUTPUT_DIR", "/tmp"))
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file = output_dir / f"tts_{hash(text)}.mp3"

        # Synthesize
        result = tts_model.synthesize(text, str(output_file))

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "TTS failed"))

        return SpeakResponse(
            success=True,
            path=result["path"],
            duration=float(result["duration"])
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/voice/speak", response_model=SpeakResponse)
@limiter.limit("10/minute")
async def speak_api_alias(request: Request, text: str = Form(...), language: str = Form("en")):
    return await speak(request=request, text=text, language=language)


@app.post("/synthesize", response_model=SynthesizeResponse)
@limiter.limit("10/minute")
async def synthesize(request: Request, synth_req: SynthesizeRequest):
    """Synthesize text to speech (JSON endpoint for desktop client).

    Accepts JSON body with {text, language} and returns {audio_url, duration}.
    This is the endpoint the desktop app calls via useVoiceService hook.
    """
    global tts_model

    if not tts_model or not tts_model.is_loaded:
        raise HTTPException(status_code=503, detail="TTS model not available")

    try:
        logger.info(f"Synthesize request: {synth_req.text[:50]}...")

        if synth_req.language != tts_model.lang:
            tts_model.set_language(synth_req.language)

        output_dir = Path(os.getenv("TTS_OUTPUT_DIR", "/tmp"))
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file = output_dir / f"tts_{hash(synth_req.text)}.mp3"

        result = tts_model.synthesize(synth_req.text, str(output_file))

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "TTS failed"))

        return SynthesizeResponse(
            audio_url=f"/audio/{output_file.name}",
            duration=float(result["duration"])
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Synthesize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/asr")
@limiter.limit("30/minute")
async def get_asr_info(request: Request):
    """Get ASR model info."""
    if not asr_model:
        raise HTTPException(status_code=503, detail="ASR model not initialized")
    
    return {
        "model": f"Whisper {asr_model.model_size}",
        "loaded": asr_model.is_loaded,
        "device": asr_model.device,
        "device_info": asr_model.get_device_info(),
        "supported_languages": asr_model.get_supported_languages()
    }


@app.get("/models/tts")
@limiter.limit("30/minute")
async def get_tts_info(request: Request):
    """Get TTS model info."""
    if not tts_model:
        raise HTTPException(status_code=503, detail="TTS model not initialized")
    
    return {
        "model": "Google Text-to-Speech",
        "loaded": tts_model.is_loaded,
        "current_language": tts_model.lang,
        "supported_languages": tts_model.get_supported_languages()
    }


@app.get("/device")
@limiter.limit("30/minute")
async def get_device_info(request: Request):
    """Get GPU/device information."""
    return DeviceConfig.get_device_info()


@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """
    WebSocket endpoint for streaming transcription with VAD.
    
    Expected protocol:
    - Client sends: {"type": "audio_chunk", "data": "<base64-encoded-pcm>"}
    - Server responds: {"type": "transcript", "text": "...", "is_final": false, "confidence": 0.92}
    - Client sends: {"type": "close"} to close connection
    """
    global streaming_transcriber
    
    if not streaming_transcriber:
        await websocket.close(code=1011, reason="Streaming transcriber not initialized")
        return
    
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        connection_start_time = asyncio.get_event_loop().time()
        chunks_received = 0
        total_audio_bytes = 0
        
        # Send initial status
        await websocket.send_json({
            "type": "status",
            "message": "Connected to streaming transcriber",
            "device": streaming_transcriber.device,
        })
        
        while True:
            try:
                # Receive message from client
                message = await asyncio.wait_for(websocket.receive_json(), timeout=30.0)
                
                if message.get("type") == "close":
                    logger.info("Client initiated connection close")
                    break
                
                if message.get("type") != "audio_chunk":
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {message.get('type')}"
                    })
                    continue
                
                # Decode audio chunk
                import base64
                try:
                    audio_bytes = base64.b64decode(message.get("data", ""))
                    audio_np = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                    total_audio_bytes += len(audio_bytes)
                    chunks_received += 1
                except Exception as e:
                    logger.error(f"Audio decode error: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Audio decode error: {str(e)}"
                    })
                    continue
                
                # Process chunk
                result = await streaming_transcriber.process_chunk(audio_np)
                
                # Send result if text is available
                if result.get("text"):
                    await websocket.send_json({
                        "type": "transcript",
                        "text": result["text"],
                        "is_final": result.get("is_final", False),
                        "confidence": result.get("confidence", 0.0),
                        "duration_ms": result.get("duration", 0.0),
                    })
                    logger.info(
                        f"Sent transcript: '{result['text'][:50]}...' "
                        f"(final={result.get('is_final')}, "
                        f"confidence={result.get('confidence', 0.0):.2f})"
                    )
                
                # Send periodic status updates
                if chunks_received % 10 == 0:
                    status = streaming_transcriber.get_status()
                    await websocket.send_json({
                        "type": "status",
                        "chunks_received": chunks_received,
                        "total_audio_ms": status["total_audio_received_ms"],
                        "in_speech": status["in_speech"],
                    })
                
            except asyncio.TimeoutError:
                logger.warning("WebSocket receive timeout, closing connection")
                await websocket.send_json({
                    "type": "status",
                    "message": "Timeout - no data received for 30s"
                })
                break
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected")
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Processing error: {str(e)}"
                })
                break
    
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Connection error: {str(e)}"
            })
        except:
            pass
    finally:
        # Connection cleanup
        connection_duration = asyncio.get_event_loop().time() - connection_start_time
        streaming_transcriber.reset()
        logger.info(
            f"WebSocket connection closed: "
            f"duration={connection_duration:.1f}s, "
            f"chunks={chunks_received}, "
            f"total_audio={total_audio_bytes} bytes"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
