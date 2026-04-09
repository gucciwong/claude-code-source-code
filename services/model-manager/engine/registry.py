"""
Model Registry — tracks all locally available models,
their format (GGUF, safetensors, pytorch), and readiness state.
"""

import os
import json
import pathlib
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class ModelRegistry:
    """Keeps an inventory of every model on disk."""

    def __init__(self, cache_dir: str = "./models"):
        self.cache_dir = os.path.abspath(cache_dir)
        os.makedirs(self.cache_dir, exist_ok=True)
        self._meta_file = os.path.join(self.cache_dir, "_registry.json")
        self._registry: Dict[str, Dict[str, Any]] = self._load()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------
    def _load(self) -> Dict[str, Dict[str, Any]]:
        if os.path.exists(self._meta_file):
            try:
                with open(self._meta_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as exc:
                logger.warning("Corrupt registry file, rebuilding: %s", exc)
        return {}

    def _save(self) -> None:
        tmp = self._meta_file + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self._registry, f, indent=2, default=str)
        os.replace(tmp, self._meta_file)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def register(
        self,
        model_id: str,
        local_path: str,
        fmt: str,
        size_bytes: int = 0,
        source: str = "huggingface",
        extra: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        entry = {
            "model_id": model_id,
            "local_path": local_path,
            "format": fmt,
            "size_bytes": size_bytes,
            "source": source,
            "registered_at": datetime.utcnow().isoformat(),
            "status": "ready",
        }
        if extra:
            entry.update(extra)
        self._registry[model_id] = entry
        self._save()
        logger.info("Registered model %s (%s, %s bytes)", model_id, fmt, size_bytes)
        return entry

    def unregister(self, model_id: str) -> bool:
        if model_id in self._registry:
            del self._registry[model_id]
            self._save()
            return True
        return False

    def get(self, model_id: str) -> Optional[Dict[str, Any]]:
        return self._registry.get(model_id)

    def list_all(self) -> List[Dict[str, Any]]:
        return list(self._registry.values())

    def scan_cache(self) -> List[Dict[str, Any]]:
        """Walk the cache dir and discover models not yet registered."""
        discovered: List[Dict[str, Any]] = []
        for item in pathlib.Path(self.cache_dir).iterdir():
            if item.name.startswith("_"):
                continue
            if not item.is_dir():
                # Single-file model (e.g. .gguf sitting directly in cache)
                fmt = _detect_format_file(item)
                if fmt:
                    key = item.stem
                    if key not in self._registry:
                        entry = self.register(
                            key,
                            str(item),
                            fmt,
                            item.stat().st_size,
                            source="local",
                        )
                        discovered.append(entry)
                continue
            # Directory-based model
            fmt = _detect_format_dir(item)
            # Convert HuggingFace cache convention "owner--repo" back to "owner/repo"
            # so the key matches what download_model registered (model_id uses "/").
            key = item.name.replace("--", "/", 1)
            if key not in self._registry and fmt:
                size = sum(
                    f.stat().st_size for f in item.rglob("*") if f.is_file()
                )
                status = "incomplete" if _has_incomplete_downloads(item) else "ready"
                entry = self.register(
                    key, str(item), fmt, size, source="local",
                    extra={"status": status},
                )
                discovered.append(entry)
        return discovered

    def purge_missing(self) -> List[str]:
        """Remove registry entries whose local_path no longer exists on disk.

        Returns a list of model_ids that were purged.
        """
        missing = [
            mid for mid, entry in self._registry.items()
            if not os.path.exists(entry.get("local_path", ""))
        ]
        if missing:
            for mid in missing:
                del self._registry[mid]
                logger.info("Purged missing model from registry: %s", mid)
            self._save()
        return missing

    def model_path(self, model_id: str) -> Optional[str]:
        entry = self._registry.get(model_id)
        return entry["local_path"] if entry else None


# ------------------------------------------------------------------
# Format detection helpers
# ------------------------------------------------------------------
def _detect_format_file(path: pathlib.Path) -> Optional[str]:
    suffix = path.suffix.lower()
    if suffix == ".gguf":
        return "gguf"
    if suffix == ".safetensors":
        return "safetensors"
    if suffix in (".bin", ".pt", ".pth"):
        return "pytorch"
    return None


def _has_incomplete_downloads(path: pathlib.Path) -> bool:
    """Return True if the directory contains HF interrupted-download blobs."""
    return any(True for _ in path.rglob("*.incomplete"))


def _detect_format_dir(path: pathlib.Path) -> Optional[str]:
    files = list(path.iterdir())
    suffixes = {f.suffix.lower() for f in files if f.is_file()}
    if ".gguf" in suffixes:
        return "gguf"
    if ".safetensors" in suffixes:
        return "safetensors"
    if ".bin" in suffixes or ".pt" in suffixes:
        return "pytorch"
    # HuggingFace snapshot dir (has config.json)
    if any(f.name == "config.json" for f in files):
        return "hf_snapshot"
    return None
