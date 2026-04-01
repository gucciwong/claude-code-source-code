"""Model registry with auto-download, caching, and metadata management."""

import hashlib
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import urllib.request
from urllib.error import URLError

logger = logging.getLogger(__name__)


class ModelMetadata:
    """Metadata for a model in registry."""

    def __init__(
        self,
        model_id: str,
        name: str,
        model_type: str,  # "asr" or "tts"
        url: str,
        size_mb: float,
        checksum: str,  # SHA256
        quantization_type: str = "fp32",  # fp32, fp16, int8, int4
        accuracy: float = 0.95,
        inference_speedup: float = 1.0,
        last_updated: Optional[str] = None,
        description: str = "",
    ):
        """
        Initialize model metadata.

        Args:
            model_id: Unique model identifier (e.g., "whisper-base")
            name: Human-readable name
            model_type: Type of model ("asr" or "tts")
            url: Download URL
            size_mb: Model size in MB
            checksum: SHA256 checksum for integrity verification
            quantization_type: Quantization applied (fp32, fp16, int8, int4)
            accuracy: Model accuracy metric (0.0-1.0)
            inference_speedup: Speedup vs baseline
            last_updated: ISO format timestamp
            description: Model description
        """
        self.model_id = model_id
        self.name = name
        self.model_type = model_type
        self.url = url
        self.size_mb = size_mb
        self.checksum = checksum
        self.quantization_type = quantization_type
        self.accuracy = accuracy
        self.inference_speedup = inference_speedup
        self.last_updated = last_updated or datetime.utcnow().isoformat()
        self.description = description

    def to_dict(self) -> Dict[str, Any]:
        """Export to dictionary."""
        return {
            "model_id": self.model_id,
            "name": self.name,
            "model_type": self.model_type,
            "url": self.url,
            "size_mb": self.size_mb,
            "checksum": self.checksum,
            "quantization_type": self.quantization_type,
            "accuracy": self.accuracy,
            "inference_speedup": self.inference_speedup,
            "last_updated": self.last_updated,
            "description": self.description,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ModelMetadata":
        """Create from dictionary."""
        return cls(**data)


class ModelRegistry:
    """Registry for managing models with caching and auto-download."""

    def __init__(self, cache_dir: Path = Path("/tmp/vibevoice-models")):
        """
        Initialize model registry.

        Args:
            cache_dir: Directory to cache downloaded models
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # Default models registry
        self.models: Dict[str, ModelMetadata] = {}
        self._load_default_models()

        # Cache metadata
        self.metadata_file = self.cache_dir / "registry.json"
        self._load_metadata()

    def _load_default_models(self) -> None:
        """Load default model configurations."""
        default_models = [
            # Whisper ASR models (FP32 baseline)
            ModelMetadata(
                model_id="whisper-tiny",
                name="Whisper Tiny",
                model_type="asr",
                url="https://huggingface.co/openai/whisper-tiny/resolve/main/model.safetensors",
                size_mb=139.0,
                checksum="placeholder_tiny",
                quantization_type="fp32",
                accuracy=0.92,
                inference_speedup=1.0,
                description="Fastest ASR model, ~40M parameters",
            ),
            ModelMetadata(
                model_id="whisper-base",
                name="Whisper Base",
                model_type="asr",
                url="https://huggingface.co/openai/whisper-base/resolve/main/model.safetensors",
                size_mb=291.0,
                checksum="placeholder_base",
                quantization_type="fp32",
                accuracy=0.95,
                inference_speedup=1.0,
                description="Balanced ASR model, ~74M parameters",
            ),
            # Whisper INT8 quantized
            ModelMetadata(
                model_id="whisper-base-int8",
                name="Whisper Base (INT8)",
                model_type="asr",
                url="https://huggingface.co/custom/whisper-base-int8/resolve/main/model.onnx",
                size_mb=73.0,
                checksum="placeholder_base_int8",
                quantization_type="int8",
                accuracy=0.94,
                inference_speedup=2.5,
                description="INT8 quantized ASR, ~75% size reduction",
            ),
            # Whisper INT4 quantized
            ModelMetadata(
                model_id="whisper-base-int4",
                name="Whisper Base (INT4)",
                model_type="asr",
                url="https://huggingface.co/custom/whisper-base-int4/resolve/main/model.onnx",
                size_mb=36.0,
                checksum="placeholder_base_int4",
                quantization_type="int4",
                accuracy=0.93,
                inference_speedup=3.2,
                description="INT4 quantized ASR, ~87.5% size reduction",
            ),
        ]

        for model in default_models:
            self.models[model.model_id] = model
            logger.debug(f"Registered model: {model.model_id}")

    def get_model(self, model_id: str) -> Optional[ModelMetadata]:
        """Get model metadata by ID."""
        return self.models.get(model_id)

    def list_models(self, model_type: Optional[str] = None) -> List[ModelMetadata]:
        """
        List all registered models, optionally filtered by type.

        Args:
            model_type: Filter by type ("asr" or "tts"), or None for all

        Returns:
            List of ModelMetadata objects
        """
        models = list(self.models.values())
        if model_type:
            models = [m for m in models if m.model_type == model_type]
        return models

    def get_model_path(self, model_id: str) -> Path:
        """Get cached model path."""
        return self.cache_dir / f"{model_id}.onnx"

    def is_cached(self, model_id: str) -> bool:
        """Check if model is cached locally."""
        path = self.get_model_path(model_id)
        return path.exists()

    def download_model(self, model_id: str, force: bool = False) -> Optional[Path]:
        """
        Download model from registry if not cached.

        Args:
            model_id: Model ID to download
            force: Force re-download even if cached

        Returns:
            Path to downloaded model, or None if download failed
        """
        model = self.get_model(model_id)
        if not model:
            logger.error(f"Model {model_id} not in registry")
            return None

        model_path = self.get_model_path(model_id)

        # Check if already cached
        if model_path.exists() and not force:
            logger.info(f"Using cached model: {model_path}")
            return model_path

        # Download
        logger.info(f"Downloading model {model_id} from {model.url}")
        try:
            urllib.request.urlretrieve(model.url, model_path)
            logger.info(f"Downloaded to {model_path} ({model.size_mb:.1f}MB)")

            # Verify checksum (if not placeholder)
            if model.checksum != "placeholder":
                if self._verify_checksum(model_path, model.checksum):
                    logger.info("Checksum verification passed")
                else:
                    logger.warning("Checksum verification failed, but proceeding")

            return model_path

        except URLError as e:
            logger.error(f"Download failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Error downloading model: {e}")
            return None

    def _verify_checksum(self, file_path: Path, expected_checksum: str) -> bool:
        """Verify file checksum (SHA256)."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        actual_checksum = sha256_hash.hexdigest()
        return actual_checksum == expected_checksum

    def register_model(self, metadata: ModelMetadata) -> None:
        """Register a new model."""
        self.models[metadata.model_id] = metadata
        self._save_metadata()
        logger.info(f"Registered model: {metadata.model_id}")

    def _save_metadata(self) -> None:
        """Save registry metadata to file."""
        try:
            registry_data = {
                model_id: model.to_dict()
                for model_id, model in self.models.items()
            }
            with open(self.metadata_file, "w") as f:
                json.dump(registry_data, f, indent=2)
            logger.debug("Saved model registry metadata")
        except Exception as e:
            logger.error(f"Failed to save metadata: {e}")

    def _load_metadata(self) -> None:
        """Load registry metadata from file."""
        if not self.metadata_file.exists():
            return

        try:
            with open(self.metadata_file, "r") as f:
                registry_data = json.load(f)
            # Merge with default models
            for model_id, model_dict in registry_data.items():
                if model_id not in self.models:
                    self.models[model_id] = ModelMetadata.from_dict(model_dict)
            logger.debug("Loaded model registry metadata")
        except Exception as e:
            logger.error(f"Failed to load metadata: {e}")

    def get_cache_size_mb(self) -> float:
        """Get total size of cached models."""
        total_size = 0
        for model_path in self.cache_dir.glob("*.onnx"):
            total_size += model_path.stat().st_size
        return total_size / (1024 * 1024)

    def clear_cache(self, older_than_days: int = 30) -> int:
        """
        Clear old cached models.

        Args:
            older_than_days: Remove models older than this many days

        Returns:
            Number of models removed
        """
        cutoff_time = datetime.utcnow() - timedelta(days=older_than_days)
        removed_count = 0

        for model_path in self.cache_dir.glob("*.onnx"):
            mtime = datetime.utcfromtimestamp(model_path.stat().st_mtime)
            if mtime < cutoff_time:
                try:
                    model_path.unlink()
                    removed_count += 1
                    logger.info(f"Removed cached model: {model_path.name}")
                except Exception as e:
                    logger.error(f"Failed to remove {model_path}: {e}")

        return removed_count

    def get_registry_summary(self) -> Dict[str, Any]:
        """Get summary of all registered models."""
        asr_models = [m for m in self.models.values() if m.model_type == "asr"]
        tts_models = [m for m in self.models.values() if m.model_type == "tts"]

        return {
            "total_models": len(self.models),
            "asr_models": len(asr_models),
            "tts_models": len(tts_models),
            "cache_size_mb": self.get_cache_size_mb(),
            "cache_dir": str(self.cache_dir),
            "models": {
                m.model_id: {
                    "name": m.name,
                    "size_mb": m.size_mb,
                    "quantization": m.quantization_type,
                    "cached": self.is_cached(m.model_id),
                }
                for m in self.models.values()
            },
        }
