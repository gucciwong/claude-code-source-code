"""Unit tests for ModelDownloader.list_all_files and _list_all_files_sync."""
import asyncio
from unittest.mock import patch, MagicMock

import pytest

from engine.downloader import ModelDownloader
from huggingface_hub.hf_api import RepoFile, RepoFolder


@pytest.fixture
def downloader():
    return ModelDownloader(cache_dir="/tmp/test-models")


def make_entry(path: str, size: int, entry_type: str = "file") -> MagicMock:
    """Create a mock that isinstance-checks as RepoFile or RepoFolder."""
    if entry_type == "file":
        e = MagicMock(spec=RepoFile)
    else:
        e = MagicMock(spec=RepoFolder)
    e.path = path
    e.size = size
    return e


# ── _list_all_files_sync ──────────────────────────────────────────────────────

def test_returns_all_file_entries(downloader: ModelDownloader):
    entries = [
        make_entry("model.Q4_K_M.gguf", 4_000_000_000),
        make_entry("README.md", 1024),
    ]
    with patch("huggingface_hub.list_repo_tree", return_value=iter(entries)):
        result = downloader._list_all_files_sync("user/repo")

    assert len(result) == 2
    assert result[0] == {"path": "model.Q4_K_M.gguf", "size_bytes": 4_000_000_000, "is_gguf": True}
    assert result[1] == {"path": "README.md", "size_bytes": 1024, "is_gguf": False}


def test_filters_out_directory_entries(downloader: ModelDownloader):
    entries = [
        make_entry("subdir", 0, entry_type="directory"),
        make_entry("model.gguf", 1000),
    ]
    with patch("huggingface_hub.list_repo_tree", return_value=iter(entries)):
        result = downloader._list_all_files_sync("user/repo")

    assert len(result) == 1
    assert result[0]["path"] == "model.gguf"


def test_gguf_detection_is_case_insensitive(downloader: ModelDownloader):
    entries = [make_entry("MODEL.GGUF", 1000)]
    with patch("huggingface_hub.list_repo_tree", return_value=iter(entries)):
        result = downloader._list_all_files_sync("user/repo")

    assert result[0]["is_gguf"] is True


def test_non_gguf_files_have_is_gguf_false(downloader: ModelDownloader):
    entries = [make_entry("config.json", 512)]
    with patch("huggingface_hub.list_repo_tree", return_value=iter(entries)):
        result = downloader._list_all_files_sync("user/repo")

    assert result[0]["is_gguf"] is False


def test_empty_repo_returns_empty_list(downloader: ModelDownloader):
    with patch("huggingface_hub.list_repo_tree", return_value=iter([])):
        result = downloader._list_all_files_sync("user/empty-repo")

    assert result == []


def test_entry_with_none_size_defaults_to_zero(downloader: ModelDownloader):
    entry = make_entry("model.gguf", 0)
    entry.size = None  # override to simulate missing size
    with patch("huggingface_hub.list_repo_tree", return_value=iter([entry])):
        result = downloader._list_all_files_sync("user/repo")

    assert result[0]["size_bytes"] == 0


# ── list_all_files (async) ────────────────────────────────────────────────────

def test_list_all_files_async_returns_results(downloader: ModelDownloader):
    """Synchronous wrapper around the async method via asyncio.run."""
    entries = [make_entry("model.gguf", 1000)]
    with patch("huggingface_hub.list_repo_tree", return_value=iter(entries)):
        result = asyncio.run(downloader.list_all_files("user/repo"))

    assert len(result) == 1
    assert result[0]["path"] == "model.gguf"
