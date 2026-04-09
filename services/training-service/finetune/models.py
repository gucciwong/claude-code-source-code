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


class AutoFinetuneRequest(BaseModel):
    """Request for one-click beginner training — all data sources auto-collected."""
    base_model: Optional[str] = None        # auto-picks first available if None
    use_completion_events: bool = True       # accepted/edited code completions
    use_corrections: bool = True             # user-corrected completions
    use_task_trajectories: bool = True       # agent task trajectories
    use_chat_history: bool = True            # chat session messages
    use_knowledge: bool = False             # knowledge-base entries (slower)
    epochs: int = 3
    batch_size: int = 4
    learning_rate: float = 3e-4
    lora_rank: int = 8
    output_dir: str = "./finetune-output"


class AutoFinetuneDataStats(BaseModel):
    """Stats returned when estimating the auto-collected dataset."""
    completion_event_count: int = 0
    correction_count: int = 0
    trajectory_count: int = 0
    chat_message_count: int = 0
    total_pairs: int = 0
    estimated_model: str = ""
