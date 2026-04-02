import pytest
import numpy as np
from search.embedder import CodeEmbedder


@pytest.fixture
def embedder():
    return CodeEmbedder(dim=256)


def test_tokenize_splits_non_alphanumeric_and_removes_short(embedder):
    tokens = embedder._tokenize("def foo(x, y):\n    return x + y")
    assert "def" in tokens
    assert "foo" in tokens
    assert "return" in tokens
    # short tokens removed
    assert "x" not in tokens
    assert "y" not in tokens


def test_embed_returns_numpy_array_of_correct_dimension(embedder):
    vec = embedder.embed("def hello_world():\n    pass")
    assert isinstance(vec, np.ndarray)
    assert vec.shape == (256,)


def test_embed_returns_zero_vector_for_empty_text(embedder):
    vec = embedder.embed("")
    assert isinstance(vec, np.ndarray)
    assert np.allclose(vec, np.zeros(256))


def test_embed_returns_unit_normalised_vector(embedder):
    embedder.update_doc_freq("def hello_world function auth user token")
    vec = embedder.embed("def hello_world():\n    return True")
    norm = np.linalg.norm(vec)
    assert abs(norm - 1.0) < 1e-6


def test_chunk_code_returns_at_least_one_chunk(embedder):
    content = "\n".join([f"line {i}" for i in range(10)])
    chunks = embedder.chunk_code(content, "test.py", "python")
    assert len(chunks) >= 1


def test_chunk_code_start_end_lines_are_positive_and_sequential(embedder):
    content = "\n".join([f"line {i}" for i in range(100)])
    chunks = embedder.chunk_code(content, "big_file.py", "python")
    for chunk in chunks:
        assert chunk["start_line"] >= 1
        assert chunk["end_line"] >= chunk["start_line"]
    # Each successive chunk starts after the previous chunk's start (monotonically increasing)
    for a, b in zip(chunks, chunks[1:]):
        assert b["start_line"] > a["start_line"]


def test_chunk_code_overlapping_chunks_share_some_lines(embedder):
    # Create content larger than CHUNK_SIZE to ensure multiple chunks
    content = "\n".join([f"code line {i}" for i in range(100)])
    chunks = embedder.chunk_code(content, "overlap_test.py", "python")
    assert len(chunks) >= 2
    # With overlap, chunk[1].start_line < chunk[0].end_line + 1
    if len(chunks) >= 2:
        assert chunks[1]["start_line"] <= chunks[0]["end_line"]
