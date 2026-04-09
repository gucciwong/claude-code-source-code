"""
Model Downloader — downloads models directly from HuggingFace Hub
(and mirrors like hf-mirror.com / ModelScope) without Ollama.
"""

import os
import logging
import asyncio
from typing import Dict, Any, Optional, Callable

logger = logging.getLogger(__name__)


class ModelDownloader:
    """
    Downloads models from HuggingFace Hub into the local cache.
    Supports:
      - Full repo snapshots (safetensors / pytorch)
      - Individual GGUF files
      - China mirrors (hf-mirror.com, ModelScope)
    """

    def __init__(
        self,
        cache_dir: str = "./models",
        hf_token: str = "",
        hf_endpoint: str = "https://huggingface.co",
    ):
        self.cache_dir = os.path.abspath(cache_dir)
        self.hf_token = hf_token
        self.hf_endpoint = hf_endpoint
        os.makedirs(self.cache_dir, exist_ok=True)

    # ------------------------------------------------------------------
    # Public: download a model (non-blocking wrapper)
    # ------------------------------------------------------------------
    async def download(
        self,
        model_id: str,
        *,
        revision: str = "main",
        gguf_filename: Optional[str] = None,
        progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    ) -> Dict[str, Any]:
        """
        Download *model_id* from HuggingFace Hub into self.cache_dir.

        When *gguf_filename* is given, only that single file is fetched
        (ideal for quantised GGUF repos that contain multiple quant variants).

        Returns dict with ``local_path``, ``format``, ``size_bytes``.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._download_sync,
            model_id,
            revision,
            gguf_filename,
            progress_callback,
        )

    # ------------------------------------------------------------------
    # Sync implementation (runs in thread-pool)
    # ------------------------------------------------------------------
    def _download_sync(
        self,
        model_id: str,
        revision: str,
        gguf_filename: Optional[str],
        progress_cb: Optional[Callable],
    ) -> Dict[str, Any]:
        # Late import so the module can be imported even without huggingface_hub
        from huggingface_hub import hf_hub_download, snapshot_download

        # Set the mirror endpoint used by huggingface_hub
        os.environ["HF_ENDPOINT"] = self.hf_endpoint
        # Disable xet protocol — it hangs on mirror redirects (hf-mirror.com → cas-bridge.xethub.hf.co)
        os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "0"

        dest_dir = os.path.join(self.cache_dir, model_id.replace("/", "--"))

        def _report(status: str, progress: int = 0, **kw):
            if progress_cb:
                progress_cb({"status": status, "progress": progress, **kw})

        _report("downloading", 0)

        try:
            if gguf_filename:
                # Single-file download (GGUF)
                local_file = hf_hub_download(
                    repo_id=model_id,
                    filename=gguf_filename,
                    revision=revision,
                    local_dir=dest_dir,
                    token=self.hf_token or None,
                )
                size_bytes = os.path.getsize(local_file)
                fmt = "gguf"
                _report("done", 100, downloaded_gb=round(size_bytes / 1e9, 2))
                return {
                    "local_path": local_file,
                    "format": fmt,
                    "size_bytes": size_bytes,
                    "model_id": model_id,
                }
            else:
                # Full snapshot download (safetensors / pytorch)
                local_dir = snapshot_download(
                    repo_id=model_id,
                    revision=revision,
                    local_dir=dest_dir,
                    token=self.hf_token or None,
                )
                size_bytes = sum(
                    f.stat().st_size
                    for f in __import__("pathlib").Path(local_dir).rglob("*")
                    if f.is_file()
                )
                fmt = self._detect_dir_format(local_dir)
                _report("done", 100, downloaded_gb=round(size_bytes / 1e9, 2))
                return {
                    "local_path": local_dir,
                    "format": fmt,
                    "size_bytes": size_bytes,
                    "model_id": model_id,
                }
        except Exception as exc:
            _report("error", error=str(exc))
            raise

    # ------------------------------------------------------------------
    # List GGUF variants in a repository
    # ------------------------------------------------------------------
    async def list_gguf_files(self, model_id: str) -> list:
        """Return a list of GGUF files available in the repo."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._list_gguf_sync, model_id)

    def _list_gguf_sync(self, model_id: str) -> list:
        from huggingface_hub import list_repo_files
        os.environ["HF_ENDPOINT"] = self.hf_endpoint
        os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "0"
        all_files = list_repo_files(model_id, token=self.hf_token or None)
        return [f for f in all_files if f.endswith(".gguf")]

    # ------------------------------------------------------------------
    # List ALL files in a repository (with size metadata)
    # ------------------------------------------------------------------
    async def list_all_files(self, model_id: str) -> list:
        """Return all files in the repo with size and type metadata."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._list_all_files_sync, model_id)

    def _list_all_files_sync(self, model_id: str) -> list:
        from huggingface_hub import list_repo_tree
        from huggingface_hub.hf_api import RepoFile
        os.environ["HF_ENDPOINT"] = self.hf_endpoint
        os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "0"
        entries = list_repo_tree(model_id, token=self.hf_token or None, recursive=True)
        result = []
        for entry in entries:
            if not isinstance(entry, RepoFile):
                continue
            result.append({
                "path": entry.path,
                "size_bytes": entry.size or 0,
                "is_gguf": entry.path.lower().endswith(".gguf"),
            })
        return result

    # ------------------------------------------------------------------
    @staticmethod
    def _detect_dir_format(path: str) -> str:
        import pathlib
        p = pathlib.Path(path)
        exts = {f.suffix.lower() for f in p.rglob("*") if f.is_file()}
        if ".gguf" in exts:
            return "gguf"
        if ".safetensors" in exts:
            return "safetensors"
        if ".bin" in exts or ".pt" in exts:
            return "pytorch"
        return "hf_snapshot"
