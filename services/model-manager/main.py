"""
Sovereign Code - Model Manager Service
Handles Huggingface model downloads, management, and inference
Supports mirror for China access (hf-mirror.com)
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import os
import json
import asyncio
from typing import Optional, List, Dict, Any

# Import config
try:
    from config import HF_TOKEN, HF_MIRROR, HF_API_ENDPOINT, HF_ENDPOINT, MODEL_CACHE_PATH, DEVICE, MAX_CACHE_GB
except ImportError:
    # Default values if config not available
    HF_TOKEN = os.getenv("HF_TOKEN", "")
    HF_MIRROR = os.getenv("HF_MIRROR", "huggingface").lower()
    HF_API_ENDPOINT = "https://hf-mirror.com/api" if HF_MIRROR == "mirror" else "https://huggingface.co/api"
    HF_ENDPOINT = "https://hf-mirror.com" if HF_MIRROR == "mirror" else "https://huggingface.co"
    MODEL_CACHE_PATH = os.getenv("MODEL_CACHE_PATH", "./models")
    DEVICE = os.getenv("DEVICE", "cpu")
    MAX_CACHE_GB = int(os.getenv("MAX_CACHE_GB", "50"))

# Initialize FastAPI app
app = FastAPI(
    title="Sovereign Code Model Manager",
    version="0.2.0",
    description="Independent model management and inference via Huggingface"
)

# Environment configuration
HF_TOKEN = os.getenv("HF_TOKEN", "")
MODEL_CACHE_PATH = os.getenv("MODEL_CACHE_PATH", "./models")
DEVICE = os.getenv("DEVICE", "cpu")  # cpu, cuda, mps
MAX_CACHE_GB = int(os.getenv("MAX_CACHE_GB", "50"))

# Ensure cache directory exists
os.makedirs(MODEL_CACHE_PATH, exist_ok=True)

# Global model state
active_model = None
download_queue = {}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "version": "0.2.0",
        "device": DEVICE,
        "cache_path": MODEL_CACHE_PATH,
        "cache_limit_gb": MAX_CACHE_GB,
        "mirror": HF_MIRROR,
        "huggingface_endpoint": HF_ENDPOINT,
        "api_endpoint": HF_API_ENDPOINT
    }


@app.get("/api/v1/mirror")
async def get_mirror_info():
    """Get current mirror configuration"""
    return {
        "current_mirror": HF_MIRROR,
        "is_china_mirror": HF_MIRROR == "mirror",
        "huggingface_endpoint": HF_ENDPOINT,
        "api_endpoint": HF_API_ENDPOINT,
        "available_mirrors": [
            {
                "name": "huggingface",
                "display": "Official Huggingface",
                "endpoint": "https://huggingface.co",
                "api_endpoint": "https://huggingface.co/api"
            },
            {
                "name": "mirror",
                "display": "Huggingface Mirror (China)",
                "endpoint": "https://hf-mirror.com",
                "api_endpoint": "https://hf-mirror.com/api"
            }
        ]
    }


@app.post("/api/v1/mirror/switch")
async def switch_mirror(mirror_name: str = "huggingface"):
    """
    Switch between mirrors (requires environment variable restart)
    Note: In production, this would require stopping and restarting the service
    """
    valid_mirrors = ["huggingface", "mirror"]
    
    if mirror_name not in valid_mirrors:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mirror. Choose from: {', '.join(valid_mirrors)}"
        )
    
    return {
        "message": f"To switch to {mirror_name} mirror, set environment variable: HF_MIRROR={mirror_name}",
        "instruction": f"set HF_MIRROR={mirror_name}" if os.name == 'nt' else f"export HF_MIRROR={mirror_name}",
        "note": "Then restart the Model Manager service",
        "recommended_for": "mirror" if mirror_name == "mirror" else "global"
    }
async def list_models():
    """List all available and cached models"""
    cached_models = []
    
    if os.path.exists(MODEL_CACHE_PATH):
        for item in os.listdir(MODEL_CACHE_PATH):
            model_path = os.path.join(MODEL_CACHE_PATH, item)
            if os.path.isdir(model_path):
                try:
                    import os
                    size_bytes = sum(
                        f.stat().st_size 
                        for f in __import__('pathlib').Path(model_path).rglob('*')
                        if f.is_file()
                    )
                    cached_models.append({
                        "id": item,
                        "name": item,
                        "cached": True,
                        "size_bytes": size_bytes,
                        "local_path": model_path
                    })
                except Exception as e:
                    print(f"Error reading model {item}: {e}")
    
    return {
        "cached_models": cached_models,
        "active_model": active_model
    }


@app.post("/api/v1/models/{model_id}/download")
async def download_model(model_id: str):
    """
    Download a model from Huggingface
    
    Args:
        model_id: Huggingface model identifier (e.g., "meta-llama/Llama-2-7b")
    """
    if not HF_TOKEN:
        raise HTTPException(
            status_code=400,
            detail="HF_TOKEN not set. Please set HF_TOKEN environment variable."
        )
    
    try:
        # Placeholder for actual download logic
        # Will use huggingface_hub.snapshot_download()
        download_queue[model_id] = {
            "status": "pending",
            "progress": 0,
            "total_size": 0
        }
        
        return {
            "message": f"Download started for {model_id}",
            "model_id": model_id,
            "cache_path": os.path.join(MODEL_CACHE_PATH, model_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/models/{model_id}/set-active")
async def set_active_model(model_id: str):
    """Set the active model for inference"""
    global active_model
    
    # Verify model exists
    model_path = os.path.join(MODEL_CACHE_PATH, model_id)
    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=404,
            detail=f"Model {model_id} not found. Download it first."
        )
    
    active_model = model_id
    return {
        "message": f"Active model set to {model_id}",
        "active_model": active_model
    }


@app.post("/api/v1/inference")
async def inference(
    prompt: str,
    model_id: Optional[str] = None,
    max_tokens: int = 512,
    temperature: float = 0.7
):
    """
    Run inference on active or specified model
    Streams responses back to client
    """
    if not model_id:
        model_id = active_model
    
    if not model_id:
        raise HTTPException(
            status_code=400,
            detail="No model specified and no active model set"
        )
    
    # Placeholder for actual inference
    # Will use transformers.pipeline()
    async def generate():
        yield f"data: {json.dumps({'token': 'Model'})} \n\n"
        yield f"data: {json.dumps({'token': ' inference'})} \n\n"
        yield f"data: {json.dumps({'token': ' endpoint'})} \n\n"
        yield f"data: {json.dumps({'token': ' active'})} \n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/api/v1/downloads/status")
async def download_status():
    """Get status of all active downloads"""
    return {
        "queue": download_queue,
        "cache_usage_gb": _get_cache_usage_gb()
    }


@app.delete("/api/v1/models/{model_id}")
async def delete_model(model_id: str):
    """Delete a cached model"""
    model_path = os.path.join(MODEL_CACHE_PATH, model_id)
    
    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=404,
            detail=f"Model {model_id} not found"
        )
    
    try:
        import shutil
        shutil.rmtree(model_path)
        return {
            "message": f"Model {model_id} deleted",
            "model_id": model_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _get_cache_usage_gb() -> float:
    """Calculate total cache usage in GB"""
    total_bytes = 0
    if os.path.exists(MODEL_CACHE_PATH):
        for dirpath, dirnames, filenames in os.walk(MODEL_CACHE_PATH):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if os.path.exists(fp):
                    total_bytes += os.path.getsize(fp)
    return total_bytes / (1024 ** 3)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8002,
        reload=True
    )
