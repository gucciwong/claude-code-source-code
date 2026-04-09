import time
from typing import Dict, List
from .models import (
    MemberScores,
    MemberAward,
    OrgLeaderboard,
    AwardTier,
    ScoreSubmission,
)

# Weights for the five scoring dimensions (sum = 1.0)
WEIGHTS = {
    "training_hours": 0.25,
    "arena_stars": 0.20,
    "skills_developed": 0.20,
    "issues_solved": 0.20,
    "knowledge_contribution_pct": 0.15,
}

# Normalisation caps for each dimension (values above the cap still score 100)
NORM_CAPS = {
    "training_hours": 500.0,       # 500 hours = max score
    "arena_stars": 1000,           # 1000 stars = max score
    "skills_developed": 50,        # 50 skills = max score
    "skills_star_ranking": 5000,   # used as bonus inside skills_developed weight
    "issues_solved": 200,          # 200 issues = max score
    "knowledge_contribution_pct": 100.0,  # already 0-100
}

TIER_THRESHOLDS = [
    (90, AwardTier.DIAMOND),
    (75, AwardTier.PLATINUM),
    (55, AwardTier.GOLD),
    (35, AwardTier.SILVER),
    (0, AwardTier.BRONZE),
]


def _normalise(value: float, cap: float) -> float:
    """Normalise a value to 0-100 range, capped at cap."""
    if cap <= 0:
        return 0.0
    return min(value / cap * 100, 100.0)


def _compute_composite(scores: MemberScores) -> float:
    """Return a weighted composite score 0-100."""
    training = _normalise(scores.training_hours, NORM_CAPS["training_hours"])
    arena = _normalise(scores.arena_stars, NORM_CAPS["arena_stars"])
    # skills_developed gets a boost from skills_star_ranking
    skills_base = _normalise(scores.skills_developed, NORM_CAPS["skills_developed"])
    skills_star_bonus = _normalise(scores.skills_star_ranking, NORM_CAPS["skills_star_ranking"])
    skills = skills_base * 0.6 + skills_star_bonus * 0.4
    issues = _normalise(scores.issues_solved, NORM_CAPS["issues_solved"])
    knowledge = _normalise(scores.knowledge_contribution_pct, NORM_CAPS["knowledge_contribution_pct"])

    composite = (
        WEIGHTS["training_hours"] * training
        + WEIGHTS["arena_stars"] * arena
        + WEIGHTS["skills_developed"] * skills
        + WEIGHTS["issues_solved"] * issues
        + WEIGHTS["knowledge_contribution_pct"] * knowledge
    )
    return round(composite, 2)


def _tier_for_score(score: float) -> AwardTier:
    for threshold, tier in TIER_THRESHOLDS:
        if score >= threshold:
            return tier
    return AwardTier.BRONZE


# In-memory storage: org_id -> { member_id -> MemberScores }
_store: Dict[str, Dict[str, MemberScores]] = {}


def submit_scores(submission: ScoreSubmission) -> MemberScores:
    """Create or update a member's scores."""
    org = _store.setdefault(submission.org_id, {})
    existing = org.get(submission.member_id)

    if existing:
        update_data = {}
        if submission.training_hours is not None:
            update_data["training_hours"] = submission.training_hours
        if submission.arena_stars is not None:
            update_data["arena_stars"] = submission.arena_stars
        if submission.skills_developed is not None:
            update_data["skills_developed"] = submission.skills_developed
        if submission.skills_star_ranking is not None:
            update_data["skills_star_ranking"] = submission.skills_star_ranking
        if submission.issues_solved is not None:
            update_data["issues_solved"] = submission.issues_solved
        if submission.knowledge_contribution_pct is not None:
            update_data["knowledge_contribution_pct"] = submission.knowledge_contribution_pct
        if update_data:
            updated = existing.model_copy(update=update_data)
            org[submission.member_id] = updated
            return updated
        return existing
    else:
        scores = MemberScores(
            member_id=submission.member_id,
            member_name=submission.member_name,
            training_hours=submission.training_hours or 0.0,
            arena_stars=submission.arena_stars or 0,
            skills_developed=submission.skills_developed or 0,
            skills_star_ranking=submission.skills_star_ranking or 0,
            issues_solved=submission.issues_solved or 0,
            knowledge_contribution_pct=submission.knowledge_contribution_pct or 0.0,
        )
        org[submission.member_id] = scores
        return scores


def compute_leaderboard(org_id: str) -> OrgLeaderboard:
    """Compute the full leaderboard for an org."""
    members_map = _store.get(org_id, {})
    awards: List[MemberAward] = []

    for scores in members_map.values():
        composite = _compute_composite(scores)
        awards.append(MemberAward(
            member_id=scores.member_id,
            member_name=scores.member_name,
            scores=scores,
            composite_score=composite,
            tier=_tier_for_score(composite),
            rank=0,
        ))

    # Sort by composite descending, then assign ranks
    awards.sort(key=lambda a: a.composite_score, reverse=True)
    for i, award in enumerate(awards):
        award.rank = i + 1

    return OrgLeaderboard(
        org_id=org_id,
        generated_at=time.time(),
        members=awards,
    )


def get_member_award(org_id: str, member_id: str) -> MemberAward | None:
    """Get the award info for a single member."""
    lb = compute_leaderboard(org_id)
    for award in lb.members:
        if award.member_id == member_id:
            return award
    return None


def seed_demo_data(org_id: str) -> OrgLeaderboard:
    """Seed demo data for testing."""
    demo_members = [
        ScoreSubmission(org_id=org_id, member_id="m1", member_name="Alice Chen", training_hours=320, arena_stars=750, skills_developed=28, skills_star_ranking=3200, issues_solved=145, knowledge_contribution_pct=42.5),
        ScoreSubmission(org_id=org_id, member_id="m2", member_name="Bob Zhang", training_hours=180, arena_stars=420, skills_developed=15, skills_star_ranking=1800, issues_solved=88, knowledge_contribution_pct=28.0),
        ScoreSubmission(org_id=org_id, member_id="m3", member_name="Carol Li", training_hours=450, arena_stars=900, skills_developed=42, skills_star_ranking=4500, issues_solved=190, knowledge_contribution_pct=65.0),
        ScoreSubmission(org_id=org_id, member_id="m4", member_name="David Wang", training_hours=90, arena_stars=200, skills_developed=8, skills_star_ranking=600, issues_solved=35, knowledge_contribution_pct=12.0),
        ScoreSubmission(org_id=org_id, member_id="m5", member_name="Eva Liu", training_hours=250, arena_stars=600, skills_developed=22, skills_star_ranking=2800, issues_solved=120, knowledge_contribution_pct=38.0),
        ScoreSubmission(org_id=org_id, member_id="m6", member_name="Frank Wu", training_hours=500, arena_stars=1000, skills_developed=50, skills_star_ranking=5000, issues_solved=200, knowledge_contribution_pct=80.0),
    ]
    for sub in demo_members:
        submit_scores(sub)
    return compute_leaderboard(org_id)
