from pydantic import BaseModel, Field
from typing import List, Optional


class FinetuneConfig(BaseModel):
    base_model: str
    dataset_path: str
    learning_rate: float = 3e-4
    epochs: int = 3
    batch_size: int = 4
    lora_rank: int = 8
    output_dir: str = "./finetune-output"


class FinetuneJob(BaseModel):
    job_id: str
    config: dict
    status: str = "queued"
    progress: float = 0.0
    current_epoch: int = 0
    total_epochs: int = 3
    loss_history: List[float] = Field(default_factory=list)
    created_at: str = ""
    completed_at: Optional[str] = None


class Checkpoint(BaseModel):
    name: str
    epoch: int
    loss: float
    path: str
