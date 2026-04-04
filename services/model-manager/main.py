"""
Sovereign Code - Model Manager Service
Handles Huggingface model downloads, management, and inference
Supports mirror for China access (hf-mirror.com)
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import json
import asyncio
import time
import urllib.request
from urllib.parse import urlencode
from typing import Optional, List, Dict, Any, Tuple

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

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# Environment configuration
HF_TOKEN = os.getenv("HF_TOKEN", "")
MODEL_CACHE_PATH = os.getenv("MODEL_CACHE_PATH", "./models")
DEVICE = os.getenv("DEVICE", "cpu")  # cpu, cuda, mps
MAX_CACHE_GB = int(os.getenv("MAX_CACHE_GB", "50"))


def _normalize_mirror_name(mirror_name: str) -> str:
    """Normalize mirror aliases to canonical mirror identifiers."""
    value = (mirror_name or "").strip().lower()
    aliases = {
        "official": "huggingface",
        "hf": "huggingface",
        "mirror": "hf-mirror",
        "hf-mirror": "hf-mirror",
        "modelscope": "modelscope",
    }
    return aliases.get(value, value)


def _mirror_endpoints(mirror_name: str) -> Tuple[str, str]:
    """Return (hf_endpoint, hf_api_endpoint) for a mirror."""
    if mirror_name == "hf-mirror":
        return "https://hf-mirror.com", "https://hf-mirror.com/api"
    if mirror_name == "modelscope":
        return "https://modelscope.cn", "https://modelscope.cn/api/v1"
    return "https://huggingface.co", "https://huggingface.co/api"


HF_MIRROR = _normalize_mirror_name(HF_MIRROR)
HF_ENDPOINT, HF_API_ENDPOINT = _mirror_endpoints(HF_MIRROR)

# Ensure cache directory exists
os.makedirs(MODEL_CACHE_PATH, exist_ok=True)

# Global model state
active_model = None
download_queue = {}


def _estimate_model_size_gb(model_id: str) -> float:
    """Estimate download size in GB from model name heuristics"""
    name = model_id.lower()
    if any(s in name for s in ['70b', '72b', '65b']): return 40.0
    if any(s in name for s in ['34b', '33b']): return 20.0
    if any(s in name for s in ['13b', '14b', '15b']): return 8.0
    if any(s in name for s in ['8b', '9b']): return 5.0
    if any(s in name for s in ['7b']): return 4.5
    if any(s in name for s in ['3b', '4b', '3.8b']): return 2.5
    if any(s in name for s in ['1b', 'mini', 'tiny']): return 1.0
    return 4.0  # default


# Ollama integration — downloads are routed through the local Ollama daemon
OLLAMA_BASE = os.getenv("OLLAMA_BASE", "http://localhost:11434")

# HuggingFace model ID → Ollama registry name
OLLAMA_MODEL_MAP: Dict[str, str] = {
    "meta-llama/Llama-3.1-8B-Instruct": "llama3.1:8b",
    "meta-llama/Llama-3.2-3B-Instruct": "llama3.2:3b",
    "meta-llama/Llama-3.3-70B-Instruct": "llama3.3:70b",
    "mistralai/Mistral-7B-Instruct-v0.3": "mistral:7b-instruct-v0.3",
    "mistralai/Mixtral-8x7B-Instruct-v0.1": "mixtral:8x7b",
    "Qwen/Qwen2.5-Coder-7B-Instruct": "qwen2.5-coder:7b",
    "Qwen/Qwen2.5-7B-Instruct": "qwen2.5:7b",
    "microsoft/Phi-3.5-mini-instruct": "phi3.5",
    "google/gemma-2-9b-it": "gemma2:9b",
    "google/gemma-2-2b-it": "gemma2:2b",
    "deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct": "deepseek-coder-v2:16b-lite",
    "NousResearch/Hermes-3-Llama-3.1-8B": "hermes3:8b",
    "codellama/CodeLlama-13b-Instruct-hf": "codellama:13b-instruct",
    "codellama/CodeLlama-7b-Instruct-hf": "codellama:7b-instruct",
}

# Reverse mapping: Ollama name → HF model ID (for list_models matching)
OLLAMA_TO_HF_MAP: Dict[str, str] = {v: k for k, v in OLLAMA_MODEL_MAP.items()}


def _hf_to_ollama_name(model_id: str) -> str:
    """Convert a HuggingFace model ID to an Ollama pull name."""
    return OLLAMA_MODEL_MAP.get(model_id, f"hf.co/{model_id}")


async def _pull_via_ollama(model_id: str, ollama_name: str):
    """Pull a model via Ollama's /api/pull with real byte-level progress tracking."""
    def _blocking_pull():
        payload = json.dumps({"name": ollama_name, "stream": True}).encode()
        req = urllib.request.Request(
            f"{OLLAMA_BASE}/api/pull",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=7200) as resp:
                layer_totals: Dict[str, int] = {}
                layer_completed: Dict[str, int] = {}
                for raw_line in resp:
                    if model_id not in download_queue:
                        return  # cancelled
                    line = raw_line.decode("utf-8", errors="replace").strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except Exception:
                        continue
                    status = event.get("status", "")
                    digest = event.get("digest", "")
                    if digest:
                        if "total" in event:
                            layer_totals[digest] = int(event["total"])
                        if "completed" in event:
                            layer_completed[digest] = int(event["completed"])
                    total_bytes = sum(layer_totals.values())
                    done_bytes = sum(
                        layer_completed.get(d, layer_totals.get(d, 0))
                        for d in layer_totals
                    )
                    if total_bytes > 0:
                        progress = min(99, round(done_bytes / total_bytes * 100))
                        download_queue[model_id]["progress"] = progress
                        download_queue[model_id]["downloaded_gb"] = round(done_bytes / 1e9, 2)
                        download_queue[model_id]["total_size_gb"] = round(total_bytes / 1e9, 2)
                    download_queue[model_id]["status"] = "downloading"
                    if status == "success":
                        download_queue[model_id]["progress"] = 100
                        if layer_totals:
                            total = sum(layer_totals.values())
                            download_queue[model_id]["total_size_gb"] = round(total / 1e9, 2)
                            download_queue[model_id]["downloaded_gb"] = round(total / 1e9, 2)
                        download_queue[model_id]["status"] = "done"
                        return
                # Loop exited without "success" event
                if model_id in download_queue and download_queue[model_id]["status"] == "downloading":
                    download_queue[model_id]["progress"] = 100
                    download_queue[model_id]["status"] = "done"
        except Exception as e:
            print(f"[model-manager] Ollama pull error for {model_id}: {e}")
            if model_id in download_queue:
                download_queue[model_id]["status"] = "error"
                download_queue[model_id]["error"] = (
                    f"Pull failed: {e}. Is Ollama running?"
                )
    await asyncio.to_thread(_blocking_pull)


async def _simulate_download(model_id: str, size_gb: float):
    """Simulate download progress for the model (placeholder until real download is wired)"""
    if model_id not in download_queue:
        return
    # Speed: ~size * 6s total, clamped between 12s and 45s
    total_s = max(12.0, min(45.0, size_gb * 6.0))
    steps = 40
    interval = total_s / steps
    download_queue[model_id]["status"] = "downloading"
    for step in range(steps):
        await asyncio.sleep(interval)
        if model_id not in download_queue:
            return  # was cancelled
        progress = round((step + 1) / steps * 100)
        downloaded_gb = round(size_gb * progress / 100, 2)
        download_queue[model_id]["progress"] = progress
        download_queue[model_id]["downloaded_gb"] = downloaded_gb
    download_queue[model_id]["status"] = "done"
    download_queue[model_id]["progress"] = 100
    download_queue[model_id]["downloaded_gb"] = size_gb


@app.get("/health")
@limiter.limit("60/minute")
async def health(request: Request):
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
@limiter.limit("30/minute")
async def get_mirror_info(request: Request):
    """Get current mirror configuration"""
    return {
        "current_mirror": HF_MIRROR,
        "is_china_mirror": HF_MIRROR in ["hf-mirror", "modelscope"],
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
                "name": "hf-mirror",
                "display": "Huggingface Mirror (China)",
                "endpoint": "https://hf-mirror.com",
                "api_endpoint": "https://hf-mirror.com/api"
            },
            {
                "name": "modelscope",
                "display": "ModelScope",
                "endpoint": "https://modelscope.cn",
                "api_endpoint": "https://modelscope.cn/api/v1"
            }
        ]
    }


@app.post("/api/v1/mirror/switch")
@limiter.limit("10/minute")
async def switch_mirror(request: Request, mirror_name: str = "huggingface"):
    """Switch active mirror for subsequent API requests within this process."""
    global HF_MIRROR, HF_ENDPOINT, HF_API_ENDPOINT

    normalized = _normalize_mirror_name(mirror_name)
    valid_mirrors = ["huggingface", "hf-mirror", "modelscope"]

    if normalized not in valid_mirrors:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mirror. Choose from: {', '.join(valid_mirrors)}"
        )

    HF_MIRROR = normalized
    HF_ENDPOINT, HF_API_ENDPOINT = _mirror_endpoints(HF_MIRROR)

    return {
        "success": True,
        "current_mirror": HF_MIRROR,
        "huggingface_endpoint": HF_ENDPOINT,
        "api_endpoint": HF_API_ENDPOINT,
        "message": f"Mirror switched to {HF_MIRROR}",
        "note": "Setting is active for this running model-manager process."
    }

@app.get("/api/v1/models")
@limiter.limit("30/minute")
async def list_models(request: Request):
    """List all models — local file cache + Ollama-managed models."""
    import pathlib
    cached_models = []

    # 1. Scan local model file cache
    if os.path.exists(MODEL_CACHE_PATH):
        for item in os.listdir(MODEL_CACHE_PATH):
            model_path = os.path.join(MODEL_CACHE_PATH, item)
            if os.path.isdir(model_path):
                try:
                    size_bytes = sum(
                        f.stat().st_size
                        for f in pathlib.Path(model_path).rglob("*")
                        if f.is_file()
                    )
                    cached_models.append({
                        "id": item,
                        "name": item,
                        "cached": True,
                        "size_bytes": size_bytes,
                        "local_path": model_path,
                        "source": "local",
                    })
                except Exception as e:
                    print(f"Error reading model {item}: {e}")

    # 2. Include Ollama-managed models (the primary source after real downloads)
    try:
        ollama_req = urllib.request.Request(f"{OLLAMA_BASE}/api/tags")
        with urllib.request.urlopen(ollama_req, timeout=2) as resp:
            ollama_data = json.loads(resp.read())
            for m in ollama_data.get("models", []):
                ollama_name = m.get("name", "")
                # Map back to HF model ID so HuggingFacePanel can match it
                hf_id = OLLAMA_TO_HF_MAP.get(ollama_name, ollama_name)
                cached_models.append({
                    "id": hf_id,
                    "name": ollama_name,
                    "cached": True,
                    "size_bytes": m.get("size", 0),
                    "local_path": "ollama",
                    "source": "ollama",
                })
    except Exception:
        pass  # Ollama offline — that's fine

    return {
        "cached_models": cached_models,
        "active_model": active_model
    }


@app.get("/api/v1/models/search")
@limiter.limit("30/minute")
async def search_models(request: Request, q: str = "", limit: int = 20):
    """Search HuggingFace Hub for models"""
    import urllib.request
    try:
        params = urlencode({"search": q, "limit": limit, "filter": "gguf"})
        url = f"{HF_API_ENDPOINT}/models?{params}"
        req = urllib.request.Request(url)
        if HF_TOKEN:
            req.add_header("Authorization", f"Bearer {HF_TOKEN}")
        with urllib.request.urlopen(req, timeout=10) as resp:
            results = json.loads(resp.read())
        models = [
            {
                "id": m.get("id", ""),
                "name": m.get("id", "").split("/")[-1],
                "cached": False,
                "downloaded": False,
                "downloading": False,
                "download_progress": 0,
                "size_gb": 0,
                "quantizations": ["fp32"],
            }
            for m in results
        ]
        return models
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"HuggingFace API error: {e}")


@app.post("/api/v1/models/{model_id:path}/download")
@limiter.limit("10/minute")
async def download_model(request: Request, model_id: str):
    """
    Pull a model via Ollama (real download + inference-ready).
    Falls back to simulation only when Ollama is unreachable.
    """
    try:
        size_gb = _estimate_model_size_gb(model_id)
        model_name = model_id.split("/")[-1] if "/" in model_id else model_id
        ollama_name = _hf_to_ollama_name(model_id)

        download_queue[model_id] = {
            "status": "pending",
            "progress": 0,
            "total_size_gb": size_gb,
            "downloaded_gb": 0.0,
            "model_name": model_name,
            "started_at": time.time(),
        }

        # Check if Ollama daemon is running
        ollama_online = False
        try:
            check = urllib.request.Request(f"{OLLAMA_BASE}/api/tags")
            with urllib.request.urlopen(check, timeout=2):
                ollama_online = True
        except Exception:
            pass

        if ollama_online:
            asyncio.create_task(_pull_via_ollama(model_id, ollama_name))
            note = f"Pulling '{ollama_name}' via Ollama — will appear in Installed tab when done"
        else:
            asyncio.create_task(_simulate_download(model_id, size_gb))
            note = "Ollama not running — simulated only (model won't be usable). Start Ollama to enable real downloads."

        return {
            "message": f"Download started for {model_id}",
            "model_id": model_id,
            "ollama_name": ollama_name,
            "size_gb": size_gb,
            "note": note,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/models/{model_id:path}/set-active")
@limiter.limit("10/minute")
async def set_active_model(request: Request, model_id: str):
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
@limiter.limit("10/minute")
async def inference(
    request: Request,
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
@limiter.limit("30/minute")
async def download_status(request: Request):
    """Get status of all active downloads"""
    return {
        "queue": download_queue,
        "cache_usage_gb": _get_cache_usage_gb()
    }


@app.delete("/api/v1/models/{model_id:path}")
@limiter.limit("10/minute")
async def delete_model(request: Request, model_id: str):
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


@app.post("/api/v1/downloads/{model_id:path}/cancel")
@limiter.limit("10/minute")
async def cancel_download(request: Request, model_id: str):
    """Cancel an in-progress download"""
    if model_id in download_queue:
        download_queue[model_id]["status"] = "cancelled"
        del download_queue[model_id]
    return {"message": f"Download cancelled for {model_id}", "model_id": model_id}


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
