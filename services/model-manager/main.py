"""
Sovereign Code - Model Manager Service
Fully standalone model management and inference via HuggingFace Hub.
Downloads, loads, runs inference, and exports models locally.
No Ollama. No LM Studio.
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
import threading
import time
import urllib.request
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
import base64
import pathlib
from typing import Optional, List, Dict, Any, Tuple

# Import config
try:
    from config import HF_TOKEN, HF_MIRROR, HF_API_ENDPOINT, HF_ENDPOINT, MODEL_CACHE_PATH, DEVICE, MAX_CACHE_GB
except ImportError:
    HF_TOKEN = os.getenv("HF_TOKEN", "")
    HF_MIRROR = os.getenv("HF_MIRROR", "huggingface").lower()
    HF_API_ENDPOINT = "https://hf-mirror.com/api" if HF_MIRROR == "mirror" else "https://huggingface.co/api"
    HF_ENDPOINT = "https://hf-mirror.com" if HF_MIRROR == "mirror" else "https://huggingface.co"
    MODEL_CACHE_PATH = os.getenv("MODEL_CACHE_PATH", "./models")
    DEVICE = os.getenv("DEVICE", "cpu")
    MAX_CACHE_GB = int(os.getenv("MAX_CACHE_GB", "50"))

# Standalone engine imports
from engine import ModelDownloader, ModelLoader, InferenceEngine, ModelExporter, ModelRegistry
from engine.model_router import ModelRouter, TaskClassifier, TaskType

# Initialize FastAPI app
app = FastAPI(
    title="Sovereign Code Model Manager",
    version="1.0.0",
    description="Standalone model management and inference — no Ollama, no LM Studio"
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:5175,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5175"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

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
_mirror_lock = threading.Lock()

# Ensure cache directory exists
os.makedirs(MODEL_CACHE_PATH, exist_ok=True)

# --- Standalone engine components (NO Ollama / NO LM Studio) ---
registry = ModelRegistry(cache_dir=MODEL_CACHE_PATH)

# State file for persisting active model across restarts
_STATE_FILE = os.path.join(MODEL_CACHE_PATH, ".model_state.json")

def _load_active_model_state() -> Optional[str]:
    """Load persisted active model from disk."""
    try:
        if os.path.exists(_STATE_FILE):
            with open(_STATE_FILE, "r") as f:
                return json.load(f).get("active_model")
    except Exception:
        pass
    return None

def _save_active_model_state(model_id: Optional[str]) -> None:
    """Persist active model to disk."""
    try:
        with open(_STATE_FILE, "w") as f:
            json.dump({"active_model": model_id}, f)
    except Exception as e:
        print(f"[model-manager] Warning: could not persist active model state: {e}")

@app.on_event("startup")
async def _startup_sync_registry():
    """On service start, purge registry entries for models that were manually deleted."""
    global active_model
    purged = registry.purge_missing()
    if purged:
        print(f"[model-manager] Startup: pruned {len(purged)} missing model(s) from registry: {purged}")
    registry.scan_cache()
    # Restore previously active model
    saved = _load_active_model_state()
    if saved and registry.get(saved):
        active_model = saved
        print(f"[model-manager] Restored active model: {active_model}")
    print("[model-manager] Registry sync complete.")

downloader = ModelDownloader(cache_dir=MODEL_CACHE_PATH, hf_token=HF_TOKEN or "")
loader = ModelLoader(device=DEVICE)
inference_engine = InferenceEngine(loader)
exporter = ModelExporter(cache_dir=MODEL_CACHE_PATH)
model_router = ModelRouter()

# Global model state
active_model = None
download_queue: Dict[str, Any] = {}
# Limit concurrent HuggingFace downloads so bandwidth is not split across all queued models.
# The 3rd+ model waits in "pending" until a slot opens rather than stalling at 0 %.
_download_semaphore = asyncio.Semaphore(2)


def _estimate_model_size_gb(model_id: str) -> float:
    """Estimate download size in GB from model name heuristics"""
    name = model_id.lower()
    if any(s in name for s in ['70b', '72b', '65b']): return 40.0
    if any(s in name for s in ['34b', '33b']): return 20.0
    if any(s in name for s in ['13b', '14b', '15b']): return 8.0
    if any(s in name for s in ['8b', '9b']): return 5.0
    if any(s in name for s in ['7b']): return 4.5
    if any(s in name for s in ['3b', '4b', '3.8b']): return 2.5
    if any(s in name for s in ['2b']): return 1.5
    if any(s in name for s in ['1b', 'mini', 'tiny']): return 1.0
    return 4.0  # default


def _get_available_memory_bytes() -> Optional[int]:
    try:
        import psutil
        return int(psutil.virtual_memory().available)
    except Exception:
        return None


def _estimate_load_requirement_bytes(entry: Optional[Dict[str, Any]]) -> int:
    if not entry:
        return 0

    size_bytes = int(entry.get("size_bytes", 0) or 0)
    fmt = entry.get("format", "hf_snapshot")

    if fmt == "gguf":
        return int(size_bytes * 1.15)

    if fmt in ("hf_snapshot", "safetensors", "pytorch"):
        return int(size_bytes * 1.75)

    return int(size_bytes * 1.5)


def _guard_load_feasibility(model_id: str, entry: Optional[Dict[str, Any]]) -> None:
    if not entry:
        return

    fmt = entry.get("format", "hf_snapshot")
    if DEVICE == "cpu" and fmt != "gguf":
        # Last resort: registry may be stale — check if the stored path actually has
        # .gguf files on disk (e.g. after a manual re-download or a scan_cache race).
        local_p = pathlib.Path(entry.get("local_path", ""))
        if local_p.is_dir() and any(local_p.glob("*.gguf")):
            # Auto-heal the registry entry so future loads skip this branch.
            registry.register(
                model_id, str(local_p), "gguf",
                entry.get("size_bytes", 0), source=entry.get("source", "local")
            )
            return
        size_bytes = int(entry.get("size_bytes", 0) or 0)
        size_gb = round(size_bytes / (1024 ** 3), 1) if size_bytes else None
        size_note = f" ({size_gb} GB)" if size_gb is not None else ""
        raise HTTPException(
            status_code=400,
            detail=(
                f"Model '{model_id}' uses {fmt}{size_note}. "
                "Interactive model-manager inference on CPU is limited to GGUF models. "
                "Delete this model and re-download from the HuggingFace tab using a -GGUF repo "
                "(e.g. bartowski/Meta-Llama-3.1-8B-Instruct-GGUF), or run the model-manager on a GPU host."
            ),
        )


# ------------------------------------------------------------------
# Real HuggingFace download (replaces _pull_via_ollama)
# ------------------------------------------------------------------
async def _track_download_progress(model_id: str, dest_dir: str, stop_event: asyncio.Event):
    """Periodically check download directory size and update download_queue progress."""
    import pathlib
    import time
    prev_downloaded_gb = 0.0
    prev_time = time.monotonic()
    while not stop_event.is_set():
        try:
            p = pathlib.Path(dest_dir)
            if p.exists():
                total_bytes = sum(f.stat().st_size for f in p.rglob("*") if f.is_file())
                downloaded_gb = round(total_bytes / 1e9, 2)
                est_total = download_queue.get(model_id, {}).get("total_size_gb", 1)
                # Auto-correct total estimate if actual download exceeds it
                if downloaded_gb > est_total * 0.95:
                    est_total = round(downloaded_gb * 1.25, 2)
                    if model_id in download_queue:
                        download_queue[model_id]["total_size_gb"] = est_total
                progress = min(99, int((downloaded_gb / max(est_total, 0.01)) * 100))
                # Compute instantaneous download speed in MB/s
                now = time.monotonic()
                elapsed = now - prev_time
                if elapsed > 0:
                    speed_mbps = round((downloaded_gb - prev_downloaded_gb) * 1000 / elapsed, 1)
                    speed_mbps = max(0.0, speed_mbps)
                else:
                    speed_mbps = 0.0
                prev_downloaded_gb = downloaded_gb
                prev_time = now
                if model_id in download_queue and download_queue[model_id]["status"] == "downloading":
                    download_queue[model_id]["downloaded_gb"] = downloaded_gb
                    download_queue[model_id]["progress"] = progress
                    download_queue[model_id]["speed_mbps"] = speed_mbps
        except Exception:
            pass
        await asyncio.sleep(0.5)


# Preferred GGUF quantization order: balance quality vs size (Q4_K_M is the community standard)
_GGUF_QUANT_PREFERENCE = ['Q4_K_M', 'Q4_K_S', 'Q5_K_M', 'Q5_K_S', 'Q4_0', 'Q6_K', 'Q8_0', 'Q3_K_M', 'Q2_K']

def _pick_default_gguf(files: list) -> Optional[str]:
    """Choose the best single GGUF file from a list of filenames in a GGUF repo."""
    if not files:
        return None
    for quant in _GGUF_QUANT_PREFERENCE:
        for f in files:
            if quant.lower() in f.lower():
                return f
    return files[0]


async def _download_from_hf(model_id: str, gguf_file: Optional[str] = None):
    """Download model from HuggingFace Hub directly. Updates download_queue in-place."""
    import pathlib
    dest_dir = os.path.join(MODEL_CACHE_PATH, model_id.replace("/", "--"))
    stop_event = asyncio.Event()
    async with _download_semaphore:
        progress_task = asyncio.create_task(_track_download_progress(model_id, dest_dir, stop_event))
        try:
            if model_id in download_queue:
                download_queue[model_id]["status"] = "downloading"

            if not gguf_file and model_id.upper().endswith('-GGUF'):
                # GGUF repo but no specific file requested — auto-pick the best variant
                # to avoid downloading all quantization files (which can be 10-20 GB).
                gguf_files = await downloader.list_gguf_files(model_id)
                gguf_file = _pick_default_gguf(gguf_files)
                if gguf_file and model_id in download_queue:
                    download_queue[model_id]["gguf_file"] = gguf_file

            if gguf_file:
                result = await downloader.download(model_id, gguf_filename=gguf_file)
            else:
                result = await downloader.download(model_id)

            local = result["local_path"]

            # Stop progress tracking
            stop_event.set()
            await progress_task

            # Detect actual format from downloaded files
            local_path = pathlib.Path(local)
            if gguf_file:
                fmt = "gguf"
            elif any(local_path.rglob("*.gguf")):
                fmt = "gguf"
            elif any(local_path.rglob("*.safetensors")):
                fmt = "safetensors"
            elif any(local_path.rglob("*.bin")) or any(local_path.rglob("*.pth")):
                fmt = "pytorch"
            else:
                fmt = "hf_snapshot"

            if local_path.is_file():
                real_bytes = local_path.stat().st_size
            else:
                real_bytes = sum(f.stat().st_size for f in local_path.rglob("*") if f.is_file())
            registry.register(model_id, local, fmt=fmt, size_bytes=real_bytes)

            size_gb = round(real_bytes / 1e9, 2)

            if model_id in download_queue:
                download_queue[model_id].update({
                    "status": "done",
                    "progress": 100,
                    "total_size_gb": size_gb,
                    "downloaded_gb": size_gb,
                    "local_path": local,
                })
        except asyncio.CancelledError:
            stop_event.set()
            try:
                await progress_task
            except asyncio.CancelledError:
                pass
            print(f"[model-manager] Download cancelled for {model_id}")
        except Exception as e:
            stop_event.set()
            await progress_task
            print(f"[model-manager] Download error for {model_id}: {e}")
            if model_id in download_queue:
                download_queue[model_id]["status"] = "error"
                download_queue[model_id]["error"] = str(e)


@app.get("/api/v1/system/hardware")
@limiter.limit("30/minute")
async def get_hardware_profile(request: Request):
    """Return accurate local machine hardware specs for model compatibility checks."""
    import os as _os
    import platform

    # --- CPU ---
    cpu_threads = _os.cpu_count() or 1

    # --- RAM via psutil ---
    ram_total_gb: float | None = None
    ram_available_gb: float | None = None
    try:
        import psutil
        vm = psutil.virtual_memory()
        ram_total_gb = round(vm.total / 1e9, 1)
        ram_available_gb = round(vm.available / 1e9, 1)
    except Exception:
        pass

    # --- Disk at model cache path ---
    disk_total_gb: float | None = None
    disk_free_gb: float | None = None
    try:
        import psutil
        cache_path = _os.path.abspath(MODEL_CACHE_PATH)
        # Walk up until we find an existing path (cache dir may not exist yet)
        check_path = cache_path
        while check_path and not _os.path.exists(check_path):
            parent = _os.path.dirname(check_path)
            if parent == check_path:
                break
            check_path = parent
        if check_path and _os.path.exists(check_path):
            du = psutil.disk_usage(check_path)
            disk_total_gb = round(du.total / 1e9, 1)
            disk_free_gb = round(du.free / 1e9, 1)
    except Exception:
        pass

    # --- GPU via torch.cuda / nvidia-smi ---
    gpu_name: str | None = None
    vram_total_gb: float | None = None
    vram_free_gb: float | None = None

    # Attempt 1: torch.cuda
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            props = torch.cuda.get_device_properties(0)
            vram_total_gb = round(props.total_memory / 1e9, 1)
            vram_free_gb = round(torch.cuda.mem_get_info(0)[0] / 1e9, 1)
    except Exception:
        pass

    # Attempt 2: pynvml (if torch not available)
    if gpu_name is None:
        try:
            import pynvml
            pynvml.nvmlInit()
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            gpu_name = pynvml.nvmlDeviceGetName(handle)
            if isinstance(gpu_name, bytes):
                gpu_name = gpu_name.decode()
            mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
            vram_total_gb = round(mem.total / 1e9, 1)
            vram_free_gb = round(mem.free / 1e9, 1)
        except Exception:
            pass

    # Attempt 3: nvidia-smi subprocess (last resort)
    if gpu_name is None:
        try:
            import subprocess
            out = subprocess.check_output(
                ["nvidia-smi", "--query-gpu=name,memory.total,memory.free",
                 "--format=csv,noheader,nounits"],
                timeout=4,
            ).decode().strip().splitlines()
            if out:
                parts = out[0].split(",")
                if len(parts) >= 3:
                    gpu_name = parts[0].strip()
                    vram_total_gb = round(float(parts[1].strip()) / 1024, 1)
                    vram_free_gb = round(float(parts[2].strip()) / 1024, 1)
        except Exception:
            pass

    return {
        "cpu_threads": cpu_threads,
        "system_memory_total_gb": ram_total_gb,
        "system_memory_available_gb": ram_available_gb,
        "disk_total_gb": disk_total_gb,
        "disk_free_gb": disk_free_gb,
        "gpu_name": gpu_name,
        "vram_total_gb": vram_total_gb,
        "vram_free_gb": vram_free_gb,
        "platform": platform.system(),
    }


@app.get("/health")
@limiter.limit("60/minute")
async def health(request: Request):
    """Health check endpoint"""
    loaded = loader.loaded_models()
    return {
        "status": "ok",
        "version": "1.0.0",
        "device": DEVICE,
        "cache_path": MODEL_CACHE_PATH,
        "cache_limit_gb": MAX_CACHE_GB,
        "mirror": HF_MIRROR,
        "huggingface_endpoint": HF_ENDPOINT,
        "api_endpoint": HF_API_ENDPOINT,
        "engine": "standalone",
        "loaded_models": loaded,
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

    with _mirror_lock:
        HF_MIRROR = normalized
        HF_ENDPOINT, HF_API_ENDPOINT = _mirror_endpoints(HF_MIRROR)
        # Update the downloader so subsequent downloads use the new mirror
        downloader.hf_endpoint = HF_ENDPOINT

    return {
        "success": True,
        "current_mirror": HF_MIRROR,
        "huggingface_endpoint": HF_ENDPOINT,
        "api_endpoint": HF_API_ENDPOINT,
        "message": f"Mirror switched to {HF_MIRROR}",
        "note": "Setting is active for this running model-manager process."
    }

@app.get("/api/v1/models")
@limiter.limit("60/minute")
async def list_models(request: Request):
    """List all models from the local registry and file cache."""
    import pathlib
    cached_models = []

    # Sync registry: drop entries for manually-deleted folders, add new ones
    registry.purge_missing()
    registry.scan_cache()
    for entry in registry.list_all():
        local = entry.get("local_path", "")
        size_bytes = 0
        if local and os.path.isdir(local):
            try:
                size_bytes = sum(
                    f.stat().st_size
                    for f in pathlib.Path(local).rglob("*")
                    if f.is_file()
                )
            except Exception:
                pass
        elif local and os.path.isfile(local):
            try:
                size_bytes = os.path.getsize(local)
            except Exception:
                pass

        cached_models.append({
            "id": entry.get("model_id", entry.get("id", "")),
            "name": entry.get("model_id", entry.get("id", "")).split("/")[-1],
            "cached": True,
            "size_bytes": size_bytes,
            "local_path": local,
            "format": entry.get("format", "unknown"),
            "source": "local",
            "status": entry.get("status", "ready"),
        })

    return {
        "cached_models": cached_models,
        "active_model": active_model,
    }


@app.get("/api/v1/models/search")
@limiter.limit("30/minute")
async def search_models(
    request: Request,
    q: str = "",
    limit: int = 20,
    task: str = "",
    library: str = "",
    language: str = "",
    license: str = "",
    other: str = "",
):
    """Search HuggingFace Hub for models.

    Model metadata/search always uses the official HuggingFace API regardless of the
    configured download mirror.  Mirrors like hf-mirror.com are CDN proxies optimised
    for file transfers and do not replicate the search/filter API reliably.  The
    download mirror is used only when fetching model weights.
    """
    import urllib.request
    # Always use the official HF search API — mirrors only accelerate downloads
    search_api = "https://huggingface.co/api"
    try:
        search_params: dict = {"search": q, "limit": limit}
        if task:
            search_params["pipeline_tag"] = task
        if library:
            search_params["library"] = library
        elif not task:
            # Default to GGUF only when no explicit task or library filter is applied
            search_params["filter"] = "gguf"
        if language:
            search_params["language"] = language
        if license:
            search_params["license"] = license
        params = urlencode(search_params)
        url = f"{search_api}/models?{params}"
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


@app.get("/api/v1/models/{model_id:path}/files")
@limiter.limit("20/minute")
async def list_model_files(request: Request, model_id: str):
    """List all files in a HuggingFace repository with size and type metadata.

    Returns a flat list of every file so the UI can present a file picker
    before the user commits to a download.
    """
    try:
        files = await downloader.list_all_files(model_id)
        return {"model_id": model_id, "files": files}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"HuggingFace API error: {e}")


# ──────────────────────────────────────────────────────────────
# CAMR — Context-Aware Model Router (Innovation #3)
# ──────────────────────────────────────────────────────────────

@app.post("/api/v1/router/select")
@limiter.limit("30/minute")
async def router_select_model(request: Request):
    """Select the best model for a given task using CAMR.

    Request body:
    {
        "prompt": "Fix the login bug",
        "context": "def login(user, pwd): ...",
        "available_models": ["qwen2.5-coder-7b", "qwen2.5-coder-32b"],
        "available_vram_gb": 24.0,
        "language": "python"
    }
    """
    try:
        body = await request.json()
        prompt = body.get("prompt", "")
        context = body.get("context", "")
        available_models = body.get("available_models")
        available_vram_gb = body.get("available_vram_gb")
        language = body.get("language", "python")

        model_id = model_router.select_model(
            prompt=prompt,
            context=context,
            available_models=available_models,
            available_vram_gb=available_vram_gb,
            language=language,
        )

        task_type = TaskClassifier.classify(prompt, context)
        complexity = TaskClassifier.classify_complexity(context) if context else "moderate"

        return {
            "model_id": model_id,
            "task_type": task_type.value,
            "complexity": complexity if isinstance(complexity, str) else complexity.value,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/router/feedback")
@limiter.limit("60/minute")
async def router_record_feedback(request: Request):
    """Record user feedback on a model selection for learning.

    Request body:
    {
        "model_id": "qwen2.5-coder-7b",
        "task_type": "completion",
        "accepted": true,
        "latency_ms": 450.2
    }
    """
    try:
        body = await request.json()
        model_id = body.get("model_id", "")
        task_type_str = body.get("task_type", "unknown")
        accepted = body.get("accepted", False)
        latency_ms = body.get("latency_ms", 0.0)

        try:
            task_type = TaskType(task_type_str)
        except ValueError:
            task_type = TaskType.UNKNOWN

        model_router.record_result(
            model_id=model_id,
            task_type=task_type,
            accepted=accepted,
            latency_ms=latency_ms,
        )

        return {"status": "recorded", "model_id": model_id, "task_type": task_type.value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/router/recommendations")
@limiter.limit("10/minute")
async def router_recommendations(request: Request):
    """Get model recommendations for each task type.

    Query params:
    - available_models: comma-separated list (optional)
    - available_vram_gb: float (optional)
    """
    try:
        available_models_str = request.query_params.get("available_models")
        available_models = available_models_str.split(",") if available_models_str else None
        available_vram_gb = request.query_params.get("available_vram_gb")
        vram = float(available_vram_gb) if available_vram_gb else None

        recommendations = model_router.get_recommendations(
            available_models=available_models or [],
            available_vram_gb=vram or 24.0,
        )

        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/models/{model_id:path}/download")
@limiter.limit("10/minute")
async def download_model(
    request: Request,
    model_id: str,
    gguf_file: Optional[str] = None,
):
    """
    Download a model directly from HuggingFace Hub.
    Optionally provide `gguf_file` query param for a specific GGUF variant.
    No Ollama required.
    """
    try:
        # Treat empty string the same as not provided (direct-download UI sends "")
        gguf_file = gguf_file if gguf_file else None
        size_gb = _estimate_model_size_gb(model_id)
        model_name = model_id.split("/")[-1] if "/" in model_id else model_id

        download_queue[model_id] = {
            "status": "pending",
            "progress": 0,
            "total_size_gb": size_gb,
            "downloaded_gb": 0.0,
            "model_name": model_name,
            "started_at": time.time(),
            "_gguf_file": gguf_file,
        }

        task = asyncio.create_task(_download_from_hf(model_id, gguf_file))
        download_queue[model_id]["_task"] = task

        return {
            "message": f"Download started for {model_id}",
            "model_id": model_id,
            "size_gb": size_gb,
            "note": "Downloading directly from HuggingFace Hub (standalone, no Ollama).",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/models/{model_id:path}/set-active")
@limiter.limit("10/minute")
async def set_active_model(request: Request, model_id: str):
    """Set the active model for inference — loads it into memory with optional config."""
    global active_model

    # Parse optional load config from request body
    load_config: Dict[str, Any] = {}
    try:
        body = await request.json()
        if isinstance(body, dict):
            load_config = body
    except Exception:
        pass  # No body or invalid JSON is fine — use defaults

    # Resolve local path from registry
    entry = registry.get(model_id)
    if entry:
        local_path = entry.get("local_path", "")
    else:
        # Use the same '--' convention the downloader uses for model IDs with slashes
        local_path = os.path.join(
            os.path.abspath(MODEL_CACHE_PATH),
            model_id.replace("/", "--"),
        )

    if not os.path.exists(local_path):
        raise HTTPException(
            status_code=404,
            detail=f"Model {model_id} not found. Download it first."
        )

    # Refuse to load models with incomplete/interrupted downloads
    if entry and entry.get("status") == "incomplete":
        raise HTTPException(
            status_code=400,
            detail=(
                f"Model '{model_id}' download is incomplete (interrupted). "
                "Resume or re-download the model before loading."
            ),
        )

    # Load into memory via the standalone loader
    if entry:
        fmt = entry.get("format", "hf_snapshot")
    else:
        # Detect format from disk rather than blindly defaulting to hf_snapshot,
        # which would be blocked by the CPU guard even for GGUF-compatible files.
        _lp = pathlib.Path(local_path)
        if _lp.is_dir():
            if any(_lp.glob("*.gguf")):
                fmt = "gguf"
            elif any(_lp.glob("*.safetensors")):
                fmt = "safetensors"
            elif any(_lp.glob("*.bin")) or any(_lp.glob("*.pth")):
                fmt = "pytorch"
            else:
                fmt = "hf_snapshot"
        elif _lp.suffix.lower() == ".gguf":
            fmt = "gguf"
        elif _lp.suffix.lower() == ".safetensors":
            fmt = "safetensors"
        else:
            fmt = "hf_snapshot"
    n_ctx = int(load_config.get("contextLength", 4096))
    n_gpu_layers = int(load_config.get("gpuOffloadLayers", -1))

    _guard_load_feasibility(model_id, entry)

    try:
        loader.load(model_id, local_path, fmt, n_ctx=n_ctx, n_gpu_layers=n_gpu_layers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {e}")

    active_model = model_id
    _save_active_model_state(active_model)
    return {
        "message": f"Active model set to {model_id} (loaded into memory)",
        "active_model": active_model,
        "load_config": {"n_ctx": n_ctx, "n_gpu_layers": n_gpu_layers},
    }


@app.post("/api/v1/models/{model_id:path}/unload")
@limiter.limit("10/minute")
async def unload_model(request: Request, model_id: str):
    """Unload a model from memory."""
    global active_model
    loader.unload(model_id)
    if active_model == model_id:
        active_model = None
        _save_active_model_state(None)
    return {"message": f"Model {model_id} unloaded", "active_model": active_model}


@app.post("/api/v1/inference")
@limiter.limit("10/minute")
async def inference(
    request: Request,
    prompt: str,
    model_id: Optional[str] = None,
    max_tokens: int = 512,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k: int = 40,
    min_p: float = 0.0,
    repeat_penalty: float = 1.0,
    frequency_penalty: float = 0.0,
    presence_penalty: float = 0.0,
    seed: int = -1,
    stop: Optional[str] = None,
):
    """
    Run inference on active or specified model.
    Streams tokens back via SSE — fully standalone, no Ollama.
    """
    target = model_id or active_model

    if not target:
        raise HTTPException(
            status_code=400,
            detail="No model specified and no active model set",
        )

    # Ensure model is loaded
    if not loader.is_loaded(target):
        entry = registry.get(target)
        if not entry:
            raise HTTPException(status_code=404, detail=f"Model {target} not found")
        _guard_load_feasibility(target, entry)
        try:
            fmt = entry.get("format", "hf_snapshot")
            loader.load(target, entry["local_path"], fmt)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load model: {e}")

    stop_list = [s.strip() for s in stop.split(",")] if stop else None

    async def generate():
        async for token in inference_engine.generate(
            target,
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
            min_p=min_p,
            repeat_penalty=repeat_penalty,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            seed=seed,
            stop=stop_list,
        ):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/api/v1/inference/complete")
@limiter.limit("10/minute")
async def inference_complete(
    request: Request,
    prompt: str,
    model_id: Optional[str] = None,
    max_tokens: int = 512,
    temperature: float = 0.7,
):
    """Non-streaming inference — returns full text at once."""
    target = model_id or active_model
    if not target:
        raise HTTPException(status_code=400, detail="No model specified and no active model set")

    if not loader.is_loaded(target):
        entry = registry.get(target)
        if not entry:
            raise HTTPException(status_code=404, detail=f"Model {target} not found")
        _guard_load_feasibility(target, entry)
        fmt = entry.get("format", "hf_snapshot")
        loader.load(target, entry["local_path"], fmt)

    text = await inference_engine.complete(
        target, prompt, max_tokens=max_tokens, temperature=temperature
    )
    return {"model_id": target, "text": text}


@app.post("/api/v1/models/{model_id:path}/export")
@limiter.limit("5/minute")
async def export_model(
    request: Request,
    model_id: str,
    target_format: str = "safetensors",
    merge_adapter: Optional[str] = None,
):
    """Export a downloaded model to a portable format (safetensors, pytorch, gguf)."""
    entry = registry.get(model_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

    try:
        result = await exporter.export(
            model_id,
            entry["local_path"],
            target_format=target_format,
            merge_adapter=merge_adapter,
        )
        return {"status": "success", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/downloads/status")
@limiter.limit("120/minute")
async def download_status(request: Request):
    """Get status of all active downloads"""
    # Strip internal (_-prefixed) fields like _task and _gguf_file before JSON serialization.
    # asyncio.Task is not JSON-serializable; keeping it would cause a 500 error on every poll.
    serializable_queue = {
        model_id: {k: v for k, v in entry.items() if not k.startswith("_")}
        for model_id, entry in download_queue.items()
    }
    return {
        "queue": serializable_queue,
        "cache_usage_gb": _get_cache_usage_gb()
    }


@app.delete("/api/v1/models/{model_id:path}")
@limiter.limit("10/minute")
async def delete_model(request: Request, model_id: str):
    """Delete a cached model"""
    global active_model

    # Prefer registry's stored absolute path; fall back to the disk convention
    # (slashes replaced with '--', matching how the downloader stores files).
    entry = registry.get(model_id)
    if entry:
        model_path = entry.get("local_path", "")
    else:
        model_path = os.path.join(
            os.path.abspath(MODEL_CACHE_PATH),
            model_id.replace("/", "--"),
        )

    if not model_path or not os.path.exists(model_path):
        raise HTTPException(
            status_code=404,
            detail=f"Model {model_id} not found"
        )

    try:
        # Unload from memory first (avoids file-lock issues on Windows)
        if loader.is_loaded(model_id):
            loader.unload(model_id)

        import shutil
        if os.path.isdir(model_path):
            shutil.rmtree(model_path)
        else:
            os.remove(model_path)

        # Remove from registry so it no longer appears in the model list
        registry.unregister(model_id)

        # Clear active-model state if this was the active model
        if active_model == model_id:
            active_model = None
            _save_active_model_state(None)

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
        task = download_queue[model_id].get("_task")
        if task and not task.done():
            task.cancel()
        del download_queue[model_id]
    return {"message": f"Download cancelled for {model_id}", "model_id": model_id}


@app.post("/api/v1/downloads/{model_id:path}/pause")
@limiter.limit("10/minute")
async def pause_download(request: Request, model_id: str):
    """Pause an in-progress download. Partial files remain on disk for resumption."""
    if model_id not in download_queue:
        raise HTTPException(status_code=404, detail=f"No active download for {model_id}")
    entry = download_queue[model_id]
    task = entry.get("_task")
    if task and not task.done():
        task.cancel()
    entry["status"] = "paused"
    entry.pop("_task", None)
    return {
        "message": f"Download paused for {model_id}",
        "model_id": model_id,
        "progress": entry.get("progress", 0),
    }


@app.post("/api/v1/downloads/{model_id:path}/resume")
@limiter.limit("10/minute")
async def resume_download(request: Request, model_id: str):
    """Resume a paused download. HuggingFace Hub continues from cached partial files."""
    if model_id not in download_queue:
        raise HTTPException(status_code=404, detail=f"No paused download for {model_id}")
    entry = download_queue[model_id]
    if entry.get("status") != "paused":
        raise HTTPException(
            status_code=400,
            detail=f"Download for {model_id} is not paused (status: {entry.get('status')})",
        )
    gguf_file = entry.get("_gguf_file")
    entry["status"] = "pending"
    task = asyncio.create_task(_download_from_hf(model_id, gguf_file))
    entry["_task"] = task
    return {"message": f"Download resumed for {model_id}", "model_id": model_id}


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


# ---------------------------------------------------------------------------
# Data Hub – Connector credential validation
# ---------------------------------------------------------------------------

_GDPR_ONLY_CONNECTORS = {"facebook", "instagram", "xiaohongshu"}


def _connector_http(method: str, url: str, headers: Dict[str, str],
                    body: Optional[bytes] = None, timeout: int = 10) -> int:
    """Execute a blocking HTTP request and return the status code.
    HTTPError codes are returned as-is; URLError/timeouts re-raise."""
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status
    except HTTPError as exc:
        return exc.code


def _test_connector_sync(connector_id: str, creds: Dict[str, str]) -> Dict[str, Any]:
    """Blocking credential check — run via run_in_executor from the async endpoint."""

    if connector_id in _GDPR_ONLY_CONNECTORS:
        # These connectors are GDPR-export only; no live API to verify against.
        return {"ok": True}

    try:
        if connector_id == "msgraph":
            token = creds.get("access_token", "")
            code = _connector_http("GET",
                "https://graph.microsoft.com/v1.0/users?$top=1&$select=id",
                {"Authorization": f"Bearer {token}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid access token — check your Azure AD Bearer token."}
            return {"ok": False, "error": f"Microsoft Graph returned HTTP {code}."}

        elif connector_id == "workday":
            tenant = creds.get("tenant", "").strip()
            token = creds.get("access_token", "")
            if not tenant:
                return {"ok": False, "error": "Tenant ID is required."}
            url = f"https://{tenant}.workday.com/api/wql/v1/data?query=SELECT+workdayID+FROM+allWorkers+LIMIT+1"
            code = _connector_http("GET", url,
                {"Authorization": f"Bearer {token}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code in (401, 403):
                return {"ok": False, "error": "Invalid credentials or insufficient permissions."}
            return {"ok": False, "error": f"Workday returned HTTP {code}."}

        elif connector_id == "sapsuccessfactors":
            company_id = creds.get("company_id", "").strip()
            username = creds.get("api_username", "").strip()
            password = creds.get("api_password", "")
            if not company_id or not username:
                return {"ok": False, "error": "Company ID and API username are required."}
            raw = f"{username}@{company_id}:{password}" if "@" not in username else f"{username}:{password}"
            auth = base64.b64encode(raw.encode()).decode()
            code = _connector_http("GET",
                "https://api4.successfactors.com/odata/v2/User?$top=1&$format=json",
                {"Authorization": f"Basic {auth}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid credentials (401 Unauthorized)."}
            return {"ok": False, "error": f"SAP SuccessFactors returned HTTP {code}."}

        elif connector_id == "bamboohr":
            subdomain = creds.get("subdomain", "").strip()
            api_key = creds.get("api_key", "")
            if not subdomain:
                return {"ok": False, "error": "Company subdomain is required."}
            auth = base64.b64encode(f"{api_key}:x".encode()).decode()
            code = _connector_http("GET",
                f"https://api.bamboohr.com/api/gateway.php/{subdomain}/v1/employees/directory",
                {"Authorization": f"Basic {auth}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 403:
                return {"ok": False, "error": "Invalid API key or subdomain (403 Forbidden)."}
            return {"ok": False, "error": f"BambooHR returned HTTP {code}."}

        elif connector_id == "rippling":
            token = creds.get("access_token", "")
            code = _connector_http("GET",
                "https://api.rippling.com/platform/api/me",
                {"Authorization": f"Bearer {token}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid access token (401 Unauthorized)."}
            return {"ok": False, "error": f"Rippling returned HTTP {code}."}

        elif connector_id == "personio":
            client_id = creds.get("client_id", "")
            client_secret = creds.get("client_secret", "")
            body = json.dumps({"client_id": client_id, "client_secret": client_secret}).encode()
            code = _connector_http("POST",
                "https://api.personio.de/v1/auth",
                {"Content-Type": "application/json", "Accept": "application/json"},
                body=body)
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid client_id or client_secret."}
            return {"ok": False, "error": f"Personio returned HTTP {code}."}

        elif connector_id == "deel":
            token = creds.get("api_token", "")
            code = _connector_http("GET",
                "https://api.letsdeel.com/rest/v2/people?limit=1",
                {"Authorization": f"Bearer {token}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid API token (401 Unauthorized)."}
            return {"ok": False, "error": f"Deel returned HTTP {code}."}

        elif connector_id == "zohopeople":
            token = creds.get("access_token", "")
            code = _connector_http("GET",
                "https://people.zoho.com/people/api/forms/P_Employee/getRecords?sIndex=1&limit=1",
                {"Authorization": f"Zoho-oauthtoken {token}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid OAuth access token."}
            return {"ok": False, "error": f"Zoho People returned HTTP {code}."}

        elif connector_id == "hibob":
            service_user = creds.get("service_user_id", "")
            service_token = creds.get("service_token", "")
            auth = base64.b64encode(f"{service_user}:{service_token}".encode()).decode()
            code = _connector_http("GET",
                "https://api.hibob.com/v1/people",
                {"Authorization": f"Basic {auth}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid service user or token (401 Unauthorized)."}
            return {"ok": False, "error": f"HiBob returned HTTP {code}."}

        elif connector_id == "leapsome":
            client_id = creds.get("client_id", "")
            client_secret = creds.get("client_secret", "")
            auth = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
            code = _connector_http("GET",
                "https://api.leapsome.com/api/v1/users",
                {"Authorization": f"Basic {auth}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid client ID or secret."}
            return {"ok": False, "error": f"Leapsome returned HTTP {code}."}

        elif connector_id == "peopleforce":
            api_key = creds.get("api_key", "")
            code = _connector_http("GET",
                "https://api.peopleforce.io/api/v1/employees?page=1&per_page=1",
                {"Authorization": f"Bearer {api_key}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid API key (401 Unauthorized)."}
            return {"ok": False, "error": f"PeopleForce returned HTTP {code}."}

        elif connector_id == "factorial":
            token = creds.get("access_token", "")
            code = _connector_http("GET",
                "https://api.factorialhr.com/api/v1/employees",
                {"Authorization": f"Bearer {token}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid access token (401 Unauthorized)."}
            return {"ok": False, "error": f"Factorial returned HTTP {code}."}

        elif connector_id == "googledrive":
            token = creds.get("access_token", "")
            code = _connector_http("GET",
                "https://www.googleapis.com/drive/v3/about?fields=user",
                {"Authorization": f"Bearer {token}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid OAuth token (401 Unauthorized)."}
            return {"ok": False, "error": f"Google Drive returned HTTP {code}."}

        elif connector_id == "linkedin":
            token = creds.get("access_token", "")
            code = _connector_http("GET",
                "https://api.linkedin.com/v2/me",
                {"Authorization": f"Bearer {token}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid access token (401 Unauthorized)."}
            return {"ok": False, "error": f"LinkedIn returned HTTP {code}."}

        elif connector_id == "tiktok":
            token = creds.get("access_token", "")
            code = _connector_http("GET",
                "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
                {"Authorization": f"Bearer {token}", "Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid access token (401 Unauthorized)."}
            return {"ok": False, "error": f"TikTok returned HTTP {code}."}

        elif connector_id == "douyin":
            token = creds.get("access_token", "")
            code = _connector_http("GET",
                f"https://open.douyin.com/oauth/userinfo/?access_token={token}",
                {"Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            return {"ok": False, "error": f"Douyin returned HTTP {code}."}

        elif connector_id == "weibo":
            token = creds.get("access_token", "")
            uid = creds.get("uid", "").strip()
            if not uid:
                return {"ok": False, "error": "User UID is required."}
            code = _connector_http("GET",
                f"https://api.weibo.com/2/users/show.json?access_token={token}&uid={uid}",
                {"Accept": "application/json"})
            if code == 200:
                return {"ok": True}
            if code == 401:
                return {"ok": False, "error": "Invalid access token (401 Unauthorized)."}
            return {"ok": False, "error": f"Weibo returned HTTP {code}."}

        else:
            return {"ok": False, "error": f"Unknown connector: {connector_id}"}

    except URLError as exc:
        return {"ok": False, "error": f"Network error: {exc.reason}"}
    except Exception as exc:
        return {"ok": False, "error": f"Unexpected error: {exc}"}


@app.post("/api/v1/connectors/{connector_id}/test")
@limiter.limit("30/minute")
async def test_connector_endpoint(request: Request, connector_id: str):
    """Validate data hub connector credentials against the live service API."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    credentials: Dict[str, str] = body.get("credentials", {})
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, _test_connector_sync, connector_id, credentials)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8002,
        reload=True
    )
