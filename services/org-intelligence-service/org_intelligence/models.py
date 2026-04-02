from pydantic import BaseModel
from typing import List, Optional, Dict
import time


class SharedPattern(BaseModel):
    id: str
    language: str
    pattern_text: str  # anonymized
    contributor_count: int = 1
    usage_count: int = 0
    created_at: float


class ContributeRequest(BaseModel):
    pattern_text: str
    language: str
    contributor_id: str


class SearchRequest(BaseModel):
    query: str


class SkillGap(BaseModel):
    topic: str
    adoption_rate: float  # 0.0–1.0
    recommended_patterns: List[str]


class SkillGapReport(BaseModel):
    gaps: List[SkillGap]
    generated_at: float


class Bottleneck(BaseModel):
    area: str
    frequency: int
    description: str
    severity: str  # 'low', 'medium', 'high'
