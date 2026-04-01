"""FastAPI voice service for VSCode + Desktop."""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
import tempfile

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

# FastAPI app
app = FastAPI(
    title="VibeVoice Service",
    description="Voice I/O service for VSCode + Desktop",
    version="0.1.0"
)

# CORS config
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model instances (singleton pattern)
asr_model: Optional[WhisperASR] = None
tts_model: Optional[GTTSAPI] = None


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


# Lifespan event handlers
@app.on_event("startup")
async def startup():
    """Initialize models on startup."""
    global asr_model, tts_model
    
    logger.info("Initializing models...")
    
    try:
        device = "cpu"  # or "cuda" if GPU available
        asr_model = WhisperASR(
            model_size=os.getenv("WHISPER_MODEL_SIZE", "base"),
            device=device
        )
        logger.info(f"ASR model loaded: {asr_model.is_loaded}")
    except Exception as e:
        logger.error(f"Failed to load ASR model: {e}")

    try:
        tts_model = GTTSAPI(
            lang=os.getenv("TTS_DEFAULT_LANG", "en")
        )
        logger.info(f"TTS model initialized: {tts_model.is_loaded}")
    except Exception as e:
        logger.error(f"Failed to initialize TTS: {e}")


@app.on_event("shutdown")
async def shutdown():
    """Clean up on shutdown."""
    global asr_model
    
    if asr_model:
        asr_model.unload()
        logger.info("ASR model unloaded")


# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        asr_loaded=bool(asr_model and asr_model.is_loaded),
        tts_loaded=bool(tts_model and tts_model.is_loaded),
        audio_capable=True,
        version="0.1.0"
    )


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(file: UploadFile = File(...), language: Optional[str] = None):
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
async def speak(text: str = Form(...), language: str = Form("en")):
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


@app.get("/models/asr")
async def get_asr_info():
    """Get ASR model info."""
    if not asr_model:
        raise HTTPException(status_code=503, detail="ASR model not initialized")
    
    return {
        "model": f"Whisper {asr_model.model_size}",
        "loaded": asr_model.is_loaded,
        "device": asr_model.device,
        "supported_languages": asr_model.get_supported_languages()
    }


@app.get("/models/tts")
async def get_tts_info():
    """Get TTS model info."""
    if not tts_model:
        raise HTTPException(status_code=503, detail="TTS model not initialized")
    
    return {
        "model": "Google Text-to-Speech",
        "loaded": tts_model.is_loaded,
        "current_language": tts_model.lang,
        "supported_languages": tts_model.get_supported_languages()
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
