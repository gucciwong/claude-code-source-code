import pytest
from persona_council.personas import PerformanceEngineer, MaintainabilityCritic, CorrectnessVerifier
from persona_council.models import Severity


# PerformanceEngineer tests

def test_perf_detects_range_len():
    engineer = PerformanceEngineer()
    code = "for i in range(len(items)):\n    print(items[i])"
    review = engineer.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("Range-Len" in t for t in titles)


def test_perf_detects_string_concatenation():
    engineer = PerformanceEngineer()
    code = "result = ''\nresult += str(x)"
    review = engineer.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("String Concatenation" in t for t in titles)


# MaintainabilityCritic tests

def test_maintain_detects_bare_except():
    critic = MaintainabilityCritic()
    code = "try:\n    do_something()\nexcept:\n    pass"
    review = critic.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("Bare Exception" in t for t in titles)
    assert any(c.severity == Severity.ERROR for c in review.critiques)


def test_maintain_detects_global_variable():
    critic = MaintainabilityCritic()
    code = "def update():\n    global counter\n    counter += 1"
    review = critic.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("Global" in t for t in titles)


def test_maintain_detects_todo_comments():
    critic = MaintainabilityCritic()
    code = "# TODO: refactor this function\ndef messy():\n    pass"
    review = critic.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("Tech Debt" in t for t in titles)


# CorrectnessVerifier tests

def test_correct_detects_unchecked_index_access():
    verifier = CorrectnessVerifier()
    code = "first = items[0]"
    review = verifier.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("First-Element" in t for t in titles)
    assert any(c.severity == Severity.ERROR for c in review.critiques)


def test_correct_detects_assert_in_production():
    verifier = CorrectnessVerifier()
    code = "assert user is not None, 'User must not be None'"
    review = verifier.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("Assert" in t for t in titles)
