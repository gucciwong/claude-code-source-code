import pytest
from completion.completion_engine import CompletionEngine


@pytest.fixture
def engine():
    return CompletionEngine()


def test_complete_returns_list(engine):
    result = engine.complete("def")
    assert isinstance(result, list)


def test_complete_with_empty_prefix_returns_empty_list(engine):
    result = engine.complete("")
    assert result == []


def test_complete_returns_at_most_max_results(engine):
    result = engine.complete("def", max_results=2)
    assert len(result) <= 2


def test_each_completion_has_text_confidence_source_keys(engine):
    result = engine.complete("def", max_results=3)
    if result:
        for item in result:
            assert "text" in item
            assert "confidence" in item
            assert "source" in item


def test_confidence_is_between_0_and_1(engine):
    result = engine.complete("def", max_results=3)
    for item in result:
        assert 0.0 <= item["confidence"] <= 1.0


def test_train_on_text_improves_completions_for_known_tokens(engine):
    engine.train("hello world hello world hello")
    result = engine.complete("hello", max_results=3)
    texts = [r["text"] for r in result]
    assert "world" in texts


def test_record_feedback_accepted_increments_feedback_count(engine):
    engine.record_feedback("function", accepted=True)
    assert engine._feedback_counts["function"] == 1


def test_record_feedback_rejected_decrements_feedback_count_floor_zero(engine):
    # Start at 0 — should not go below 0
    engine.record_feedback("function", accepted=False)
    assert engine._feedback_counts["function"] == 0

    # Increment then decrement
    engine.record_feedback("function", accepted=True)
    engine.record_feedback("function", accepted=False)
    assert engine._feedback_counts["function"] == 0
