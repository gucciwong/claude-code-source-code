import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from memory.memory_store import MemoryStore
from memory.context_builder import ContextBuilder


@pytest.fixture
def store():
    return MemoryStore()


@pytest.fixture
def builder(store):
    return ContextBuilder(store)


@pytest.fixture
def populated(store, builder):
    store.add("Python is a programming language", tags=["python"])
    store.add("FastAPI is a web framework for Python", tags=["fastapi", "python"])
    store.add("Pydantic handles data validation", tags=["pydantic"])
    return builder


def test_build_returns_required_keys(populated):
    result = populated.build("python")
    assert "query" in result
    assert "relevant_memories" in result
    assert "compressed_context" in result
    assert "token_estimate" in result


def test_build_returns_relevant_memories_list(populated):
    result = populated.build("python")
    assert isinstance(result["relevant_memories"], list)
    assert len(result["relevant_memories"]) > 0


def test_build_compressed_context_is_string(populated):
    result = populated.build("python")
    assert isinstance(result["compressed_context"], str)


def test_build_token_estimate_is_integer(populated):
    result = populated.build("python")
    assert isinstance(result["token_estimate"], int)


def test_build_with_empty_store_returns_empty_relevant_memories(builder):
    result = builder.build("anything")
    assert result["relevant_memories"] == []


def test_build_respects_top_k(populated):
    result = populated.build("python", top_k=1)
    assert len(result["relevant_memories"]) <= 1
