import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from memory.memory_store import MemoryStore


@pytest.fixture
def store():
    s = MemoryStore()
    return s


def test_add_returns_memory_dict_with_id_and_text(store):
    mem = store.add("hello world")
    assert "id" in mem
    assert mem["text"] == "hello world"


def test_add_stores_memory_count_increases(store):
    assert store.count() == 0
    store.add("first memory")
    assert store.count() == 1
    store.add("second memory")
    assert store.count() == 2


def test_search_returns_empty_list_for_empty_store(store):
    results = store.search("anything")
    assert results == []


def test_search_returns_results_with_score_and_memory(store):
    store.add("python programming language")
    results = store.search("python")
    assert len(results) > 0
    assert "score" in results[0]
    assert "memory" in results[0]


def test_search_returns_at_most_top_k_results(store):
    for i in range(10):
        store.add(f"memory item {i} python")
    results = store.search("python", top_k=3)
    assert len(results) <= 3


def test_remove_returns_true_and_deletes_memory(store):
    mem = store.add("to be deleted")
    mem_id = mem["id"]
    assert store.count() == 1
    result = store.remove(mem_id)
    assert result is True
    assert store.count() == 0


def test_remove_returns_false_for_unknown_id(store):
    result = store.remove("nonexistent-id-12345")
    assert result is False


def test_list_returns_all_stored_memories(store):
    store.add("alpha")
    store.add("beta")
    store.add("gamma")
    all_mems = store.list()
    assert len(all_mems) == 3
    texts = {m["text"] for m in all_mems}
    assert texts == {"alpha", "beta", "gamma"}
