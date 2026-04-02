import pytest
import numpy as np
from search.index_manager import IndexManager

SAMPLE_CONTENT = "\n".join([f"def func_{i}(x):\n    return x + {i}" for i in range(50)])


@pytest.fixture
def manager():
    m = IndexManager()
    return m


def test_index_content_returns_chunk_count_greater_than_zero(manager):
    count = manager.index_content(SAMPLE_CONTENT, "sample.py", "python")
    assert count > 0


def test_index_content_adds_chunks_for_the_file(manager):
    manager.index_content(SAMPLE_CONTENT, "sample.py", "python")
    chunks = manager.get_chunks()
    assert len(chunks) > 0
    assert all(c.file_path == "sample.py" for c in chunks)


def test_clear_resets_chunks_and_indexed_files(manager):
    manager.index_content(SAMPLE_CONTENT, "sample.py", "python")
    manager.clear()
    assert len(manager.get_chunks()) == 0
    assert manager.get_status()["indexed_files"] == 0


def test_get_status_returns_empty_when_no_content_indexed(manager):
    status = manager.get_status()
    assert status["status"] == "empty"
    assert status["total_chunks"] == 0
    assert status["indexed_files"] == 0


def test_get_status_returns_total_chunks_after_indexing(manager):
    count = manager.index_content(SAMPLE_CONTENT, "sample.py", "python")
    status = manager.get_status()
    assert status["total_chunks"] == count
    assert status["status"] == "ready"


def test_index_content_replaces_existing_chunks_for_same_file(manager):
    manager.index_content(SAMPLE_CONTENT, "sample.py", "python")
    first_count = len(manager.get_chunks())

    short_content = "def simple():\n    pass\n"
    manager.index_content(short_content, "sample.py", "python")

    # Should have only chunks from the new content
    chunks = manager.get_chunks()
    assert all(c.file_path == "sample.py" for c in chunks)
    # New content is shorter, so fewer chunks
    assert len(chunks) < first_count


def test_get_embeddings_returns_array_matching_chunk_count(manager):
    manager.index_content(SAMPLE_CONTENT, "sample.py", "python")
    embeddings = manager.get_embeddings()
    chunks = manager.get_chunks()
    assert embeddings.shape[0] == len(chunks)
    assert embeddings.shape[1] == manager._embedder.dim
