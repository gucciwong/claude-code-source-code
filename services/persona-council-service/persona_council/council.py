import uuid
from typing import List
from .models import PersonaReview, CouncilReport, RiskScore, ReviewRequest
from .personas import SecurityAuditor, PerformanceEngineer, MaintainabilityCritic, CorrectnessVerifier

PERSONAS = [SecurityAuditor(), PerformanceEngineer(), MaintainabilityCritic(), CorrectnessVerifier()]


class CouncilOrchestrator:
    def review(self, req: ReviewRequest) -> CouncilReport:
        reviews: List[PersonaReview] = []
        for persona in PERSONAS:
            review = persona.review(req.code, req.language)
            reviews.append(review)

        breakdown = {r.persona_name: r.risk_score for r in reviews}
        overall = round(sum(breakdown.values()) / len(breakdown), 1) if breakdown else 0.0

        risk_score = RiskScore(overall=overall, breakdown=breakdown)

        # Generate consensus summary
        total_critiques = sum(len(r.critiques) for r in reviews)
        high_risk_personas = [r.persona_name for r in reviews if r.risk_score >= 7.0]

        # Flag HIGH RISK if average is high OR if any single persona finds critical issues
        is_high_risk = overall >= 7.0 or len(high_risk_personas) > 0

        if is_high_risk:
            summary = f"HIGH RISK ({overall}/10): {total_critiques} issues found. Critical concerns from: {', '.join(high_risk_personas) or 'all reviewers'}."
        elif overall >= 4.0:
            summary = f"MEDIUM RISK ({overall}/10): {total_critiques} issues found across {len([r for r in reviews if r.critiques])} reviewers."
        elif overall > 0:
            summary = f"LOW RISK ({overall}/10): {total_critiques} minor issues found. Generally safe to proceed."
        else:
            summary = "NO ISSUES DETECTED: All 4 reviewers found no concerns with this code snippet."

        return CouncilReport(
            session_id=str(uuid.uuid4()),
            code_snippet=req.code[:200],
            language=req.language,
            reviews=reviews,
            risk_score=risk_score,
            consensus_summary=summary
        )
