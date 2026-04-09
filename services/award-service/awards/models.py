from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class AwardTier(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    DIAMOND = "diamond"


class MemberScores(BaseModel):
    """Raw scores across the 5 award dimensions for a single member."""
    member_id: str
    member_name: str
    training_hours: float = 0.0          # hours spent training public models
    arena_stars: int = 0                  # stars on models shared in arena
    skills_developed: int = 0             # skills / mini-programs developed & open-sourced
    skills_star_ranking: int = 0          # total stars across all skills
    issues_solved: int = 0               # public issues solved by member's skills
    knowledge_contribution_pct: float = 0.0  # % of knowledge contributed to public model training


class MemberAward(BaseModel):
    """Computed award result for a member."""
    member_id: str
    member_name: str
    scores: MemberScores
    composite_score: float               # weighted composite 0-100
    tier: AwardTier
    rank: int                            # rank within the org leaderboard


class OrgLeaderboard(BaseModel):
    org_id: str
    generated_at: float                  # unix timestamp
    members: List[MemberAward]


class ScoreSubmission(BaseModel):
    """Payload to submit / update a member's scores."""
    org_id: str
    member_id: str
    member_name: str
    training_hours: Optional[float] = None
    arena_stars: Optional[int] = None
    skills_developed: Optional[int] = None
    skills_star_ranking: Optional[int] = None
    issues_solved: Optional[int] = None
    knowledge_contribution_pct: Optional[float] = None
