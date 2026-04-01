"""Model registry - version management, promotion, and rollback."""

import asyncio
import json
import logging
import shutil
from dataclasses import dataclass, asdict, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class AdapterMetadata:
    """Metadata for a trained adapter version."""

    version_id: str
    created_at: str
    model_id: str
    base_model: str
    training_cycle: str  # "quick" or "full"
    training_run_id: str
    training_loss: float
    eval_loss: Optional[float] = None
    adapter_path: str = ""  # Path to adapter weights
    metrics: Dict = field(default_factory=dict)  # Benchmark results, etc
    tags: List[str] = field(default_factory=list)  # ["stable", "experimental", "archived"]
    parent_version: Optional[str] = None  # For rollback chain
    promotion_history: List[Dict] = field(default_factory=list)  # [{timestamp, from, to}, ...]

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> "AdapterMetadata":
        return cls(**data)


@dataclass
class ModelVersion:
    """Published model version for inference."""

    version_id: str
    created_at: str
    model_id: str
    adapter_id: str  # Reference to best adapter version
    merged_model_path: str  # Path to merged model (base + adapter)
    status: str  # "draft", "staging", "production", "archived"
    quality_score: float  # 0.0-1.0 based on benchmarks
    promoted_at: Optional[str] = None
    promotion_reason: Optional[str] = None
    rollback_to: Optional[str] = None  # If rolled back, version it returned to

    def to_dict(self) -> Dict:
        return asdict(self)


class ModelRegistry:
    """Central registry for trained model versions."""

    def __init__(self, registry_dir: Path):
        """Initialize model registry.

        Args:
            registry_dir: Base directory for storing registry metadata and models
        """
        self.registry_dir = registry_dir
        self.metadata_dir = registry_dir / "metadata"
        self.models_dir = registry_dir / "models"
        self.versions_dir = registry_dir / "versions"

        # Create directories
        for d in [self.metadata_dir, self.models_dir, self.versions_dir]:
            d.mkdir(parents=True, exist_ok=True)

        # Registry index
        self.index_file = self.metadata_dir / "registry_index.json"
        self.versions_file = self.metadata_dir / "versions.jsonl"
        self.adapters_file = self.metadata_dir / "adapters.jsonl"

        self._index: Dict = self._load_index()

    def _load_index(self) -> Dict:
        """Load registry index from disk."""
        if self.index_file.exists():
            with open(self.index_file, "r") as f:
                return json.load(f)

        return {
            "models": {},  # {model_id: {active_adapter, active_version, history[]}}
            "adapters": {},  # {adapter_id: AdapterMetadata}
            "versions": {},  # {version_id: ModelVersion}
        }

    def _save_index(self) -> None:
        """Persist registry index to disk."""
        with open(self.index_file, "w") as f:
            json.dump(self._index, f, indent=2)

    async def register_adapter(
        self,
        model_id: str,
        adapter_path: Path,
        training_run_id: str,
        training_cycle: str,
        training_loss: float,
        eval_loss: Optional[float],
        metrics: Dict,
        base_model: str = "mistral-7b",
    ) -> AdapterMetadata:
        """Register a newly trained adapter.

        Args:
            model_id: Model identifier
            adapter_path: Path to adapter weights (LoRA directory)
            training_run_id: Unique training run ID
            training_cycle: "quick" or "full"
            training_loss: Final training loss
            eval_loss: Validation loss (optional)
            metrics: Benchmark/quality metrics
            base_model: Base model ID

        Returns:
            AdapterMetadata for the registered adapter
        """
        # Generate version ID
        timestamp = datetime.utcnow()
        version_id = f"{model_id}_{training_cycle}_{timestamp.strftime('%Y%m%d_%H%M%S')}"

        # Copy adapter to registry
        registry_adapter_path = self.models_dir / version_id
        if adapter_path.exists():
            shutil.copytree(adapter_path, registry_adapter_path, dirs_exist_ok=True)
            logger.info(f"Copied adapter to {registry_adapter_path}")

        # Create metadata
        metadata = AdapterMetadata(
            version_id=version_id,
            created_at=timestamp.isoformat(),
            model_id=model_id,
            base_model=base_model,
            training_cycle=training_cycle,
            training_run_id=training_run_id,
            training_loss=training_loss,
            eval_loss=eval_loss,
            adapter_path=str(registry_adapter_path),
            metrics=metrics,
            tags=["experimental"],
        )

        # Store in index
        self._index["adapters"][version_id] = metadata.to_dict()

        # Initialize model entry if needed
        if model_id not in self._index["models"]:
            self._index["models"][model_id] = {
                "active_adapter": None,
                "active_version": None,
                "history": [],
            }

        # Append to history
        self._index["models"][model_id]["history"].append({
            "version_id": version_id,
            "timestamp": timestamp.isoformat(),
            "action": "register",
            "training_cycle": training_cycle,
        })

        self._save_index()
        self._log_adapter(metadata)

        logger.info(f"Registered adapter: {version_id}")
        return metadata

    async def publish_version(
        self,
        model_id: str,
        adapter_id: str,
        status: str = "staging",
        quality_score: float = 0.9,
        reason: Optional[str] = None,
    ) -> ModelVersion:
        """Publish an adapter as a model version for inference.

        Args:
            model_id: Model identifier
            adapter_id: Adapter version ID
            status: "staging" (default) or "production"
            quality_score: Quality metric (0.0-1.0)
            reason: Promotion reason

        Returns:
            ModelVersion for inference
        """
        adapter_meta = self._index["adapters"].get(adapter_id)
        if not adapter_meta:
            raise ValueError(f"Adapter not found: {adapter_id}")

        # Generate version ID
        timestamp = datetime.utcnow()
        version_id = f"v_{int(timestamp.timestamp())}"

        # Placeholder for merged model path (would be created by merge operation)
        merged_path = self.versions_dir / version_id / "merged"
        merged_path.mkdir(parents=True, exist_ok=True)

        # Create version
        version = ModelVersion(
            version_id=version_id,
            created_at=timestamp.isoformat(),
            model_id=model_id,
            adapter_id=adapter_id,
            merged_model_path=str(merged_path),
            status=status,
            quality_score=quality_score,
            promoted_at=timestamp.isoformat(),
            promotion_reason=reason,
        )

        # Store in index
        self._index["versions"][version_id] = version.to_dict()

        # Update model active version
        self._index["models"][model_id]["active_adapter"] = adapter_id
        self._index["models"][model_id]["active_version"] = version_id

        # Log promotion
        adapter_meta["promotion_history"].append({
            "timestamp": timestamp.isoformat(),
            "from": adapter_meta.get("tags", []),
            "to": [status],
            "quality_score": quality_score,
        })
        adapter_meta["tags"] = [status]

        # Update model history
        self._index["models"][model_id]["history"].append({
            "version_id": version_id,
            "timestamp": timestamp.isoformat(),
            "action": "publish",
            "status": status,
            "quality_score": quality_score,
        })

        self._save_index()
        self._log_version(version)

        logger.info(f"Published version: {version_id} (status={status}, quality={quality_score:.2f})")
        return version

    async def promote_version(
        self,
        model_id: str,
        version_id: str,
        new_status: str,  # "staging" → "production"
    ) -> ModelVersion:
        """Promote a version to a higher status.

        Args:
            model_id: Model identifier
            version_id: Version to promote
            new_status: Target status ("staging" or "production")

        Returns:
            Updated ModelVersion
        """
        version_dict = self._index["versions"].get(version_id)
        if not version_dict:
            raise ValueError(f"Version not found: {version_id}")

        # Update status
        version_dict["status"] = new_status
        version_dict["promoted_at"] = datetime.utcnow().isoformat()

        # Log promotion
        self._index["models"][model_id]["history"].append({
            "version_id": version_id,
            "timestamp": datetime.utcnow().isoformat(),
            "action": "promote",
            "to_status": new_status,
        })

        self._save_index()

        logger.info(f"Promoted {version_id} to {new_status}")
        return ModelVersion(**version_dict)

    async def rollback(
        self,
        model_id: str,
        to_version: Optional[str] = None,
    ) -> ModelVersion:
        """Rollback to a previous model version.

        Args:
            model_id: Model identifier
            to_version: Specific version to rollback to (None = previous)

        Returns:
            Updated ModelVersion
        """
        current_version_id = self._index["models"][model_id]["active_version"]
        history = self._index["models"][model_id]["history"]

        # Determine target version
        if to_version:
            target_version_id = to_version
        else:
            # Find previous published version
            published = [h for h in reversed(history) if h.get("action") == "publish"]
            if len(published) < 2:
                raise ValueError("No previous version to rollback to")
            target_version_id = published[1]["version_id"]

        target_version_dict = self._index["versions"].get(target_version_id)
        if not target_version_dict:
            raise ValueError(f"Target version not found: {target_version_id}")

        # Update active version
        self._index["models"][model_id]["active_version"] = target_version_id
        target_version_dict["rollback_to"] = current_version_id

        # Log rollback
        self._index["models"][model_id]["history"].append({
            "version_id": target_version_id,
            "timestamp": datetime.utcnow().isoformat(),
            "action": "rollback",
            "from": current_version_id,
        })

        self._save_index()

        logger.warning(f"Rolled back to {target_version_id}")
        return ModelVersion(**target_version_dict)

    def get_active_version(self, model_id: str) -> Optional[ModelVersion]:
        """Get the currently active model version.

        Args:
            model_id: Model identifier

        Returns:
            Active ModelVersion or None
        """
        model = self._index["models"].get(model_id)
        if not model or not model.get("active_version"):
            return None

        version_dict = self._index["versions"].get(model["active_version"])
        return ModelVersion(**version_dict) if version_dict else None

    def get_version_history(self, model_id: str, limit: int = 10) -> List[Dict]:
        """Get version history for a model.

        Args:
            model_id: Model identifier
            limit: Max entries to return

        Returns:
            List of history entries
        """
        model = self._index["models"].get(model_id, {})
        history = model.get("history", [])
        return history[-limit:]

    def get_adapter_stats(self, model_id: str) -> Dict:
        """Get statistics about adapters for a model.

        Args:
            model_id: Model identifier

        Returns:
            Stats including counts, quality, etc
        """
        adapters = [a for a in self._index["adapters"].values() if a["model_id"] == model_id]

        if not adapters:
            return {}

        quality_scores = [a.get("metrics", {}).get("quality_score", 0) for a in adapters]
        training_losses = [a["training_loss"] for a in adapters]

        return {
            "total_adapters": len(adapters),
            "avg_quality": sum(quality_scores) / len(quality_scores) if quality_scores else 0,
            "best_quality": max(quality_scores) if quality_scores else 0,
            "avg_training_loss": sum(training_losses) / len(training_losses),
            "best_training_loss": min(training_losses),
            "experimental_count": sum(1 for a in adapters if "experimental" in a.get("tags", [])),
            "production_count": sum(1 for a in adapters if "production" in a.get("tags", [])),
        }

    def list_versions(self, model_id: Optional[str] = None, status: Optional[str] = None) -> List[ModelVersion]:
        """List model versions with optional filtering.

        Args:
            model_id: Filter by model (None = all)
            status: Filter by status ("staging", "production", etc)

        Returns:
            List of ModelVersions
        """
        versions = []

        for v_dict in self._index["versions"].values():
            # Filter by model
            if model_id and v_dict["model_id"] != model_id:
                continue

            # Filter by status
            if status and v_dict["status"] != status:
                continue

            versions.append(ModelVersion(**v_dict))

        # Sort by created_at descending
        return sorted(versions, key=lambda v: v.created_at, reverse=True)

    def cleanup_old_adapters(
        self,
        model_id: str,
        keep_count: int = 5,
        keep_days: int = 7,
    ) -> int:
        """Remove old adapter versions.

        Args:
            model_id: Model identifier
            keep_count: Keep at least this many recent adapters
            keep_days: Keep adapters newer than this many days

        Returns:
            Number of adapters removed
        """
        cutoff_time = datetime.utcnow() - timedelta(days=keep_days)

        adapters = sorted(
            [a for a in self._index["adapters"].values() if a["model_id"] == model_id],
            key=lambda a: a["created_at"],
            reverse=True,
        )

        removed = 0
        for i, adapter in enumerate(adapters):
            # Keep recent adapters
            if i < keep_count:
                continue

            # Keep recent by time
            created_at = datetime.fromisoformat(adapter["created_at"])
            if created_at > cutoff_time:
                continue

            # Check if in production (don't delete)
            if "production" in adapter.get("tags", []):
                continue

            # Remove
            adapter_path = Path(adapter["adapter_path"])
            if adapter_path.exists():
                shutil.rmtree(adapter_path)

            del self._index["adapters"][adapter["version_id"]]
            removed += 1

            logger.info(f"Cleaned up adapter: {adapter['version_id']}")

        if removed > 0:
            self._save_index()

        return removed

    def _log_adapter(self, metadata: AdapterMetadata) -> None:
        """Log adapter to JSONL file."""
        with open(self.adapters_file, "a") as f:
            f.write(json.dumps(metadata.to_dict()) + "\n")

    def _log_version(self, version: ModelVersion) -> None:
        """Log version to JSONL file."""
        with open(self.versions_file, "a") as f:
            f.write(json.dumps(version.to_dict()) + "\n")

    def export_for_inference(
        self,
        version_id: str,
        output_path: Path,
    ) -> Path:
        """Export a model version for inference deployment.

        Args:
            version_id: Version to export
            output_path: Target directory

        Returns:
            Path to exported model
        """
        version = self._index["versions"].get(version_id)
        if not version:
            raise ValueError(f"Version not found: {version_id}")

        # Copy merged model to output
        source = Path(version["merged_model_path"])
        if source.exists():
            shutil.copytree(source, output_path, dirs_exist_ok=True)
            logger.info(f"Exported {version_id} to {output_path}")
            return output_path
        else:
            raise FileNotFoundError(f"Merged model not found: {source}")
