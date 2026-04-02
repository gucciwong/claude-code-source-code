from pydantic import BaseModel
from typing import List, Optional, Dict
from enum import Enum


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskSpec(BaseModel):
    id: str
    title: str
    description: str
    dependencies: List[str] = []  # task ids this depends on
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[str] = None
    error: Optional[str] = None


class OrchestratorSession(BaseModel):
    id: str
    goal: str
    context: str
    tasks: List[TaskSpec] = []
    status: TaskStatus = TaskStatus.PENDING
    created_at: float
    completed_at: Optional[float] = None
    merged_result: Optional[str] = None
