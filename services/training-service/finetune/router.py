from fastapi import APIRouter, HTTPException

from .models import FinetuneConfig
from .job_manager import FinetuneJobManager

router = APIRouter(prefix="/finetune", tags=["finetune"])
job_manager = FinetuneJobManager()


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
