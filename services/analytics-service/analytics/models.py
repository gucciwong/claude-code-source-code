from pydantic import BaseModel
from typing import List, Optional, Dict
from enum import Enum

class EventType(str, Enum):
    CONNECTOR_QUERY = "connector_query"
    TRACE_EXECUTED = "trace_executed"
    PATTERN_SAVED = "pattern_saved"
    TRAINING_RUN = "training_run"
    CHAT_SESSION = "chat_session"
    CODE_REVIEW = "code_review"
    TOKEN_USAGE = "token_usage"

class MetricEvent(BaseModel):
    event_type: EventType
    timestamp: float  # Unix timestamp
    value: float = 1.0  # numeric value (tokens, duration_ms, quality_score, etc.)
    metadata: Dict[str, str] = {}

class ProductivityMetrics(BaseModel):
    total_sessions: int
    total_tokens: float
    avg_tokens_per_session: float
    total_code_reviews: int
    total_training_runs: int
    acceptance_rate: float  # 0.0–1.0, simulated

class QualityTrend(BaseModel):
    date_label: str       # e.g., "2026-04-01"
    avg_quality_score: float
    pattern_count: int

class TrainingROI(BaseModel):
    total_training_runs: int
    avg_improvement_pct: float  # percentage before/after quality improvement
    time_saved_hours: float     # estimated based on tokens accepted
    estimated_roi_multiplier: float  # e.g., 3.2x

class AnalyticsReport(BaseModel):
    generated_at: float
    total_events: int
    productivity: ProductivityMetrics
    quality_trends: List[QualityTrend]
    training_roi: TrainingROI
