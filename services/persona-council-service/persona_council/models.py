from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class Severity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class CritiqueItem(BaseModel):
    title: str
    description: str
    severity: Severity
    line_hint: Optional[int] = None  # optional line number reference


class PersonaReview(BaseModel):
    persona_name: str
    persona_description: str
    critiques: List[CritiqueItem]
    risk_score: float  # 0.0–10.0


class ReviewRequest(BaseModel):
    code: str
    language: str = "python"
    context: str = ""


class RiskScore(BaseModel):
    overall: float
    breakdown: dict  # persona_name -> score


class CouncilReport(BaseModel):
    session_id: str
    code_snippet: str  # first 200 chars
    language: str
    reviews: List[PersonaReview]
    risk_score: RiskScore
    consensus_summary: str
