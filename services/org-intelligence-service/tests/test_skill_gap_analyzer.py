import time
import pytest
from org_intelligence.skill_gap_analyzer import SkillGapAnalyzer
from org_intelligence.models import SharedPattern, SkillGapReport


def make_pattern(text: str, language: str = "python") -> SharedPattern:
    return SharedPattern(
        id="test-id",
        language=language,
        pattern_text=text,
        contributor_count=1,
        usage_count=0,
        created_at=time.time(),
    )


@pytest.fixture
def analyzer():
    return SkillGapAnalyzer()


def test_analyze_empty_returns_no_gaps(analyzer):
    report = analyzer.analyze([])
    assert isinstance(report, SkillGapReport)
    assert report.gaps == []


def test_analyze_detects_error_handling_gap(analyzer):
    patterns = [
        make_pattern("def add(a, b): return a + b"),
        make_pattern("def multiply(x, y): return x * y"),
    ]
    report = analyzer.analyze(patterns)
    topics = [g.topic for g in report.gaps]
    assert "error_handling" in topics


def test_analyze_does_not_flag_high_adoption_topic(analyzer):
    # All patterns use try/except -> error_handling adoption = 100%, should NOT be a gap
    patterns = [
        make_pattern("try:\n    result = process()\nexcept Exception as e:\n    handle(e)"),
        make_pattern("try:\n    data = fetch()\nexcept ValueError:\n    raise"),
    ]
    report = analyzer.analyze(patterns)
    topics = [g.topic for g in report.gaps]
    assert "error_handling" not in topics


def test_analyze_returns_skill_gap_report_with_generated_at(analyzer):
    before = time.time()
    report = analyzer.analyze([make_pattern("def foo(): pass")])
    after = time.time()
    assert isinstance(report, SkillGapReport)
    assert before <= report.generated_at <= after


def test_multiple_topics_can_be_flagged(analyzer):
    # Plain pattern with no error handling, no async, no testing
    patterns = [make_pattern("x = 1 + 2")]
    report = analyzer.analyze(patterns)
    assert len(report.gaps) >= 2


def test_recommended_patterns_truncated_to_80_chars(analyzer):
    long_text = "try:\n    " + "x" * 200 + "\nexcept Exception:\n    pass"
    patterns = [make_pattern(long_text)]
    # This pattern uses try/except, so error_handling is NOT a gap
    # Use a pattern without try/except for gap detection
    gap_patterns = [make_pattern("x = 1")]
    report = analyzer.analyze(gap_patterns)
    for gap in report.gaps:
        for rec in gap.recommended_patterns:
            assert len(rec) <= 80
