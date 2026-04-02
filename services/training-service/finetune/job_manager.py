import uuid
from datetime import datetime
from typing import Dict, List, Optional

from .models import FinetuneJob, FinetuneConfig, Checkpoint


class FinetuneJobManager:
    def __init__(self):
        self._jobs: Dict[str, FinetuneJob] = {}
        self._checkpoints: List[Checkpoint] = []

    def start_job(self, config: FinetuneConfig) -> FinetuneJob:
        job_id = str(uuid.uuid4())
        job = FinetuneJob(
            job_id=job_id,
            config=config.dict(),
            status="queued",
            total_epochs=config.epochs,
            created_at=datetime.utcnow().isoformat(),
        )
        self._jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> Optional[FinetuneJob]:
        return self._jobs.get(job_id)

    def stop_job(self, job_id: str) -> bool:
        if job_id not in self._jobs:
            return False
        self._jobs[job_id].status = "stopped"
        self._jobs[job_id].completed_at = datetime.utcnow().isoformat()
        return True

    def list_jobs(self) -> List[FinetuneJob]:
        return list(self._jobs.values())

    def add_checkpoint(self, checkpoint: Checkpoint) -> None:
        self._checkpoints.append(checkpoint)

    def list_checkpoints(self) -> List[Checkpoint]:
        return list(self._checkpoints)

    def simulate_progress(self, job_id: str) -> Optional[FinetuneJob]:
        """Advance job by one 'step' for demo/testing."""
        job = self._jobs.get(job_id)
        if not job or job.status not in ("queued", "running"):
            return job
        job.status = "running"
        base_loss = 2.5 - (job.progress * 2.0)
        job.loss_history.append(
            round(base_loss + (0.1 * (len(job.loss_history) % 3 - 1)), 3)
        )
        job.progress = min(1.0, round(job.progress + 0.1, 10))
        job.current_epoch = int(job.progress * job.total_epochs)
        if job.progress >= 1.0 - 1e-9:
            job.status = "complete"
            job.completed_at = datetime.utcnow().isoformat()
            self._checkpoints.append(
                Checkpoint(
                    name=f"checkpoint-epoch-{job.total_epochs}",
                    epoch=job.total_epochs,
                    loss=job.loss_history[-1] if job.loss_history else 0.5,
                    path=f"{job.config.get('output_dir', './output')}/final",
                )
            )
        return job

    def count(self) -> int:
        return len(self._jobs)
