from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from .models import AutoFinetuneRequest, AutoFinetuneDataStats, FinetuneConfig
from .job_manager import FinetuneJobManager
from training_data.models import init_db, get_session_maker
from training_data.store import TrainingDataStore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/finetune", tags=["finetune"])
job_manager = FinetuneJobManager()

# Query the local model-manager service for installed models (no Ollama needed)
MODEL_MANAGER_URL = os.getenv("MODEL_MANAGER_URL", "http://127.0.0.1:8002")

# Database for auto-collecting user data
_DB_PATH = os.getenv("DB_PATH", "./data/training.db")
_SessionLocal = None


def _get_db_session():
    """Lazily initialise and return a DB session for the finetune router."""
    global _SessionLocal
    if _SessionLocal is None:
        init_db(_DB_PATH)
        _SessionLocal = get_session_maker(_DB_PATH)
    return _SessionLocal()


@router.get("/models")
async def list_available_models():
    """List all available models from the standalone model-manager service."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MODEL_MANAGER_URL}/api/v1/models", timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                models = data.get("cached_models", [])
                return {
                    "status": "success",
                    "count": len(models),
                    "models": [
                        {
                            "name": m.get("id", m.get("name")),
                            "size": m.get("size_bytes", 0),
                            "format": m.get("format", "unknown"),
                            "local_path": m.get("local_path", ""),
                        }
                        for m in models
                    ],
                }
            else:
                raise HTTPException(status_code=500, detail="Model manager API error")
    except httpx.ConnectError:
        # Fall back to scanning the local model directories
        models_dir = Path.home() / ".sovereign-code" / "models" / "base"
        local_models = []
        if models_dir.exists():
            for item in models_dir.iterdir():
                if item.is_dir():
                    local_models.append({"name": item.name, "size": 0, "format": "unknown", "local_path": str(item)})
        return {
            "status": "success",
            "count": len(local_models),
            "models": local_models,
            "note": "Model manager service not running — listing local files only",
        }
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-info/{model_name:path}")
async def get_model_info(model_name: str):
    """Get detailed information about a specific model via the model-manager service."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{MODEL_MANAGER_URL}/api/v1/models",
                timeout=5.0,
            )
            if response.status_code == 200:
                data = response.json()
                for m in data.get("cached_models", []):
                    if m.get("id") == model_name or m.get("name") == model_name:
                        return {"status": "success", "model": m}
                raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
            else:
                raise HTTPException(status_code=500, detail="Model manager API error")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Model manager service not running on " + MODEL_MANAGER_URL)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
async def start_finetune(config: FinetuneConfig):
    job = job_manager.start_job(config)
    return {"job_id": job.job_id, "status": job.status}


@router.get("/status/{job_id}")
async def finetune_status(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/stop/{job_id}")
async def stop_finetune(job_id: str):
    stopped = job_manager.stop_job(job_id)
    if not stopped:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "ok"}


@router.get("/jobs")
async def list_jobs():
    return job_manager.list_jobs()


@router.get("/checkpoints")
async def list_checkpoints():
    return job_manager.list_checkpoints()


@router.post("/simulate/{job_id}")
async def simulate_step(job_id: str):
    """Advance job progress by one step (for testing/demo)."""
    job = job_manager.simulate_progress(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


class ChatMessagePayload(BaseModel):
    """A single chat message."""
    role: str  # "user" or "assistant"
    content: str
    session_id: Optional[str] = None
    model_id: Optional[str] = None


class ChatMessagesRequest(BaseModel):
    """Request to submit chat messages for training."""
    messages: List[ChatMessagePayload]


@router.post("/chat-messages")
async def submit_chat_messages(request: ChatMessagesRequest):
    """Submit chat messages to store for use in training.

    The client should call this before starting one-click training when
    use_chat_history is enabled, to sync local chat history to the backend.
    """
    db = _get_db_session()
    try:
        store = TrainingDataStore(db)

        # Convert Pydantic models to dicts
        message_dicts = [msg.model_dump() for msg in request.messages]

        count = store.add_chat_messages_batch(message_dicts)
        logger.info(f"Stored {count} chat messages for training")

        return {"stored": count}
    except Exception as e:
        logger.error(f"Error storing chat messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ---------------------------------------------------------------------------
# One-click / auto training helpers
# ---------------------------------------------------------------------------

async def _pick_best_model() -> str:
    """Return the name of the first available model, falling back to a placeholder."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MODEL_MANAGER_URL}/api/v1/models", timeout=5.0)
            if response.status_code == 200:
                models = response.json().get("cached_models", [])
                if models:
                    return models[0].get("id") or models[0].get("name", "unknown")
    except Exception:
        pass

    # Fall back to local scan
    models_dir = Path.home() / ".sovereign-code" / "models" / "base"
    if models_dir.exists():
        for item in models_dir.iterdir():
            if item.is_dir():
                return item.name
    return "sovereign-code-base"


def _build_auto_dataset(req: AutoFinetuneRequest) -> tuple[str, dict]:
    """Collect user data from the local DB and write a JSONL training file.

    Returns (path_to_jsonl, stats_dict).
    """
    db = _get_db_session()
    try:
        store = TrainingDataStore(db)

        pairs: list[dict] = []
        stats: dict = {
            "completion_event_count": 0,
            "correction_count": 0,
            "trajectory_count": 0,
            "chat_message_count": 0,
        }

        if req.use_completion_events:
            events = store.get_incremental_dataset(
                event_types=["completion_accepted"],
                max_samples=500,
            )
            for ev in events:
                prompt = ev.get("prompt", "")
                completion = ev.get("completion", "")
                if prompt and completion:
                    pairs.append({"prompt": prompt, "completion": completion})
                    stats["completion_event_count"] += 1

        if req.use_corrections:
            corrections = store.get_incremental_dataset(
                event_types=["completion_edited"],
                max_samples=500,
            )
            for ev in corrections:
                prompt = ev.get("prompt", "")
                completion = ev.get("completion", "")
                if prompt and completion:
                    pairs.append({"prompt": prompt, "completion": completion})
                    stats["correction_count"] += 1

        if req.use_task_trajectories:
            from training_data.models import TaskTrajectory
            trajectories = (
                db.query(TaskTrajectory)
                .filter(TaskTrajectory.outcome == "success")
                .limit(200)
                .all()
            )
            for t in trajectories:
                if t.task_description and t.final_code:
                    pairs.append({
                        "prompt": t.task_description,
                        "completion": t.final_code,
                    })
                    stats["trajectory_count"] += 1

        if req.use_chat_history:
            chat_pairs = store.get_chat_conversations(max_pairs=500)
            for pair in chat_pairs:
                pairs.append({"prompt": pair["prompt"], "completion": pair["completion"]})
                stats["chat_message_count"] += 1

        # Write JSONL to user data dir
        data_dir = Path.home() / ".sovereign-code" / "training-data"
        data_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
        out_path = data_dir / f"auto-{ts}.jsonl"

        with open(out_path, "w", encoding="utf-8") as f:
            for pair in pairs:
                f.write(json.dumps(pair, ensure_ascii=False) + "\n")

        stats["total_pairs"] = len(pairs)
        return str(out_path), stats
    finally:
        db.close()


@router.get("/auto-dataset-stats")
async def auto_dataset_stats():
    """Return how much data is available for one-click training without starting a job."""
    db = _get_db_session()
    try:
        store = TrainingDataStore(db)
        raw = store.get_stats()
        chat_count = store.get_chat_message_count()
        # Count actual chat pairs (user->assistant transitions)
        chat_pairs = store.get_chat_conversations(max_pairs=1000)
        model_name = await _pick_best_model()
        return AutoFinetuneDataStats(
            completion_event_count=raw.get("completion_accepted", 0),
            correction_count=raw.get("completion_edited", 0),
            trajectory_count=raw.get("task_completed_total", 0),
            chat_message_count=len(chat_pairs),
            total_pairs=(
                raw.get("completion_accepted", 0)
                + raw.get("completion_edited", 0)
                + len(chat_pairs)
            ),
            estimated_model=model_name,
        )
    finally:
        db.close()


@router.post("/auto-start")
async def auto_start_finetune(req: AutoFinetuneRequest):
    """One-click training: auto-collect user data and launch a fine-tune job.

    The caller does not need to supply a dataset path or model name — everything
    is discovered automatically from the local training data store.
    """
    base_model = req.base_model or await _pick_best_model()
    dataset_path, data_stats = _build_auto_dataset(req)

    if data_stats["total_pairs"] == 0:
        raise HTTPException(
            status_code=422,
            detail=(
                "No training data found. Use the extension for a while to collect "
                "accepted completions, then try again."
            ),
        )

    output_dir = str(
        Path.home() / ".sovereign-code" / "finetune-output" / f"run-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}"
    )

    config = FinetuneConfig(
        base_model=base_model,
        dataset_path=dataset_path,
        learning_rate=req.learning_rate,
        epochs=req.epochs,
        batch_size=req.batch_size,
        lora_rank=req.lora_rank,
        output_dir=req.output_dir if req.output_dir != "./finetune-output" else output_dir,
    )

    job = job_manager.start_job(config)
    return {
        "job_id": job.job_id,
        "status": job.status,
        "base_model": base_model,
        "dataset_path": dataset_path,
        "data_stats": data_stats,
        "message": (
            f"One-click training started with {data_stats['total_pairs']} pairs "
            f"from your personal data."
        ),
    }
