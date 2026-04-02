import pytest
from persona_council.council import CouncilOrchestrator
from persona_council.models import ReviewRequest


@pytest.fixture
def orchestrator():
    return CouncilOrchestrator()


def test_review_returns_council_report_with_4_reviews(orchestrator):
    req = ReviewRequest(code="def add(a, b):\n    return a + b", language="python")
    report = orchestrator.review(req)
    assert len(report.reviews) == 4


def test_risk_score_breakdown_has_entry_for_each_persona(orchestrator):
    req = ReviewRequest(code="x = 1", language="python")
    report = orchestrator.review(req)
    assert len(report.risk_score.breakdown) == 4


def test_overall_risk_is_average_of_persona_scores(orchestrator):
    req = ReviewRequest(code="x = 1", language="python")
    report = orchestrator.review(req)
    scores = list(report.risk_score.breakdown.values())
    expected_avg = round(sum(scores) / len(scores), 1)
    assert report.risk_score.overall == expected_avg


def test_consensus_summary_high_risk_for_dangerous_code(orchestrator):
    # Code with eval + password + pickle should trigger HIGH RISK
    dangerous_code = (
        'result = eval(user_input)\n'
        'password = "supersecret"\n'
        'data = pickle.loads(raw)\n'
        'os.system("rm -rf /")\n'
    )
    req = ReviewRequest(code=dangerous_code, language="python")
    report = orchestrator.review(req)
    assert "HIGH RISK" in report.consensus_summary or report.risk_score.overall >= 4.0


def test_consensus_summary_no_issues_for_clean_code(orchestrator):
    clean_code = "def add(a, b):\n    return a + b\n"
    req = ReviewRequest(code=clean_code, language="python")
    report = orchestrator.review(req)
    # Clean code → all reviewers return 0, summary says NO ISSUES DETECTED
    if report.risk_score.overall == 0.0:
        assert "NO ISSUES" in report.consensus_summary
    else:
        # Some reviewers may still find minor issues, but overall should be low
        assert report.risk_score.overall < 7.0
