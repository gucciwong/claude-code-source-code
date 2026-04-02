import pytest
from search.index_manager import IndexManager
from search.search_engine import SearchEngine

PYTHON_CONTENT = "\n".join([
    f"def authenticate_user_{i}(username, password):\n    # Verify credentials\n    return check_db(username, password)"
    for i in range(30)
])

JAVASCRIPT_CONTENT = "\n".join([
    f"function fetchData_{i}(url) {{\n    return fetch(url).then(r => r.json())\n}}"
    for i in range(30)
])


@pytest.fixture
def engine_empty():
    manager = IndexManager()
    return SearchEngine(manager)


@pytest.fixture
def engine_with_data():
    manager = IndexManager()
    manager.index_content(PYTHON_CONTENT, "auth.py", "python")
    manager.index_content(JAVASCRIPT_CONTENT, "fetch.js", "javascript")
    return SearchEngine(manager)


def test_search_returns_empty_list_when_index_is_empty(engine_empty):
    results = engine_empty.search("authentication function")
    assert results == []


def test_search_returns_top_k_or_fewer_results(engine_with_data):
    results = engine_with_data.search("authenticate user credentials", top_k=3)
    assert len(results) <= 3


def test_search_results_have_required_keys(engine_with_data):
    results = engine_with_data.search("function", top_k=2)
    required_keys = {"file_path", "score", "chunk_text", "start_line", "end_line", "language"}
    for r in results:
        assert required_keys.issubset(set(r.keys()))


def test_search_with_language_filter_returns_only_matching(engine_with_data):
    results = engine_with_data.search("function", top_k=5, language_filter="python")
    assert all(r["language"] == "python" for r in results)


def test_search_with_unknown_language_filter_returns_empty(engine_with_data):
    results = engine_with_data.search("function", top_k=5, language_filter="cobol")
    assert results == []


def test_search_scores_are_in_descending_order(engine_with_data):
    results = engine_with_data.search("authenticate user password", top_k=5)
    scores = [r["score"] for r in results]
    assert scores == sorted(scores, reverse=True)
