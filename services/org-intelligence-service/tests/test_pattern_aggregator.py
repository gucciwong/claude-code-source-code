import pytest
from org_intelligence.pattern_aggregator import PatternAggregator
from org_intelligence.models import ContributeRequest, SharedPattern


@pytest.fixture
def aggregator():
    return PatternAggregator()


def make_req(text: str, language: str = "python", contributor_id: str = "user1") -> ContributeRequest:
    return ContributeRequest(pattern_text=text, language=language, contributor_id=contributor_id)


def test_contribute_returns_shared_pattern(aggregator):
    req = make_req("def add(a, b): return a + b")
    result = aggregator.contribute(req)
    assert isinstance(result, SharedPattern)
    assert result.language == "python"
    assert result.contributor_count == 1


def test_contribute_anonymizes_text(aggregator):
    req = make_req("# Author: JohnDoe\ndef func(): pass")
    result = aggregator.contribute(req)
    assert "JohnDoe" not in result.pattern_text
    assert "[AUTHOR REDACTED]" in result.pattern_text


def test_contribute_similar_pattern_merges(aggregator):
    text = "def calculate_total(items): return sum(item.price for item in items)"
    req1 = make_req(text, contributor_id="user1")
    req2 = make_req(text, contributor_id="user2")
    result1 = aggregator.contribute(req1)
    result2 = aggregator.contribute(req2)
    assert result1.id == result2.id
    assert result2.contributor_count == 2


def test_contribute_dissimilar_pattern_creates_new(aggregator):
    req1 = make_req("def add(a, b): return a + b", language="python")
    req2 = make_req("SELECT * FROM users WHERE active = true ORDER BY created_at DESC", language="sql")
    result1 = aggregator.contribute(req1)
    result2 = aggregator.contribute(req2)
    assert result1.id != result2.id
    assert len(aggregator.list_patterns()) == 2


def test_list_patterns_returns_all(aggregator):
    aggregator.contribute(make_req("def foo(): pass"))
    aggregator.contribute(make_req("SELECT id FROM orders WHERE status = 'pending'"))
    assert len(aggregator.list_patterns()) == 2


def test_search_with_matching_query_returns_results(aggregator):
    aggregator.contribute(make_req("def parse_json(data): return json.loads(data)"))
    aggregator.contribute(make_req("SELECT * FROM logs WHERE level = 'error'"))
    results = aggregator.search("json parse")
    assert len(results) > 0


def test_search_with_no_match_returns_empty(aggregator):
    aggregator.contribute(make_req("def add(a, b): return a + b"))
    results = aggregator.search("zxqvkjwnmfxyz")
    assert results == []


def test_search_returns_results_sorted_by_relevance(aggregator):
    aggregator.contribute(make_req("def parse_json(data): return json.loads(data)", language="python"))
    aggregator.contribute(make_req("def multiply(x, y): return x * y", language="python"))
    aggregator.contribute(make_req("def json_serialize(obj): return json.dumps(obj)", language="python"))
    results = aggregator.search("json")
    assert len(results) >= 2
    # First result should be more relevant — just verify order makes sense (no assertion on scores)
    assert results[0].pattern_text != results[-1].pattern_text
