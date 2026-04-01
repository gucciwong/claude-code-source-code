"""Redis-based cache for loaded models across instances.

Coordinates which models are loaded on which instances to minimize
redundant loading and optimize memory usage in a distributed setup.
"""

import json
import logging
from datetime import datetime
from typing import Optional, Dict, List, Set, Any

from ..config.redis_config import redis_client

logger = logging.getLogger(__name__)

# Redis key prefixes
MODEL_INSTANCE_PREFIX = "model_instance:"
INSTANCE_MODELS_PREFIX = "instance_models:"
MODEL_STATS_PREFIX = "model_stats:"
INSTANCE_HEARTBEAT_PREFIX = "instance_heartbeat:"

# Timeouts (seconds)
HEARTBEAT_TIMEOUT = 60  # Instance heartbeat considered stale after this
MODEL_CACHE_TTL = 86400  # 24 hours


class ModelCache:
    """Manages model loading state across service instances."""

    def __init__(self):
        """Initialize model cache."""
        self.redis = redis_client.client

    def register_instance(self, instance_id: str, max_memory_gb: float) -> None:
        """Register a service instance with its capacity.

        Args:
            instance_id: Unique instance identifier
            max_memory_gb: Maximum memory available for models on this instance
        """
        instance_data = {
            "instance_id": instance_id,
            "max_memory_gb": max_memory_gb,
            "registered_at": datetime.utcnow().isoformat(),
            "models": [],
        }

        key = f"{INSTANCE_MODELS_PREFIX}{instance_id}"
        self.redis.setex(key, HEARTBEAT_TIMEOUT, json.dumps(instance_data))

        # Update heartbeat
        heartbeat_key = f"{INSTANCE_HEARTBEAT_PREFIX}{instance_id}"
        self.redis.setex(heartbeat_key, HEARTBEAT_TIMEOUT, datetime.utcnow().isoformat())

        logger.info(f"Registered instance {instance_id} with {max_memory_gb}GB capacity")

    def load_model(
        self,
        instance_id: str,
        model_id: str,
        model_size_mb: float,
        load_time_ms: float,
    ) -> bool:
        """Record that a model is loaded on an instance.

        Args:
            instance_id: Instance that loaded the model
            model_id: Model ID
            model_size_mb: Size of loaded model in MB
            load_time_ms: Time taken to load (milliseconds)

        Returns:
            True if recorded, False if instance not registered
        """
        instance_key = f"{INSTANCE_MODELS_PREFIX}{instance_id}"
        instance_data_str = self.redis.get(instance_key)

        if not instance_data_str:
            logger.warning(f"Instance {instance_id} not found")
            return False

        instance_data = json.loads(instance_data_str)
        if model_id not in instance_data["models"]:
            instance_data["models"].append(model_id)

        # Update instance data
        self.redis.setex(instance_key, HEARTBEAT_TIMEOUT, json.dumps(instance_data))

        # Store model instance mapping
        model_instance_key = f"{MODEL_INSTANCE_PREFIX}{model_id}"
        model_instances = self.redis.lrange(model_instance_key, 0, -1)
        if instance_id not in model_instances:
            self.redis.lpush(model_instance_key, instance_id)
        self.redis.expire(model_instance_key, MODEL_CACHE_TTL)

        # Update model statistics
        stats_key = f"{MODEL_STATS_PREFIX}{model_id}"
        stats_str = self.redis.get(stats_key)
        if stats_str:
            stats = json.loads(stats_str)
        else:
            stats = {
                "model_id": model_id,
                "total_loads": 0,
                "total_load_time_ms": 0,
                "instances": [],
                "size_mb": model_size_mb,
            }

        stats["total_loads"] += 1
        stats["total_load_time_ms"] += load_time_ms
        if instance_id not in stats["instances"]:
            stats["instances"].append(instance_id)

        self.redis.setex(stats_key, MODEL_CACHE_TTL, json.dumps(stats))

        logger.info(
            f"Loaded model {model_id} on instance {instance_id} "
            f"({model_size_mb}MB in {load_time_ms}ms)"
        )
        return True

    def unload_model(self, instance_id: str, model_id: str) -> bool:
        """Record that a model is unloaded from an instance.

        Args:
            instance_id: Instance that unloaded the model
            model_id: Model ID

        Returns:
            True if recorded, False if model not on instance
        """
        instance_key = f"{INSTANCE_MODELS_PREFIX}{instance_id}"
        instance_data_str = self.redis.get(instance_key)

        if not instance_data_str:
            return False

        instance_data = json.loads(instance_data_str)
        if model_id in instance_data["models"]:
            instance_data["models"].remove(model_id)
            self.redis.setex(instance_key, HEARTBEAT_TIMEOUT, json.dumps(instance_data))

        # Remove from model instance list
        model_instance_key = f"{MODEL_INSTANCE_PREFIX}{model_id}"
        self.redis.lrem(model_instance_key, 1, instance_id)

        logger.info(f"Unloaded model {model_id} from instance {instance_id}")
        return True

    def get_model_instances(self, model_id: str) -> List[str]:
        """Get all instances where a model is loaded.

        Args:
            model_id: Model ID

        Returns:
            List of instance IDs
        """
        model_instance_key = f"{MODEL_INSTANCE_PREFIX}{model_id}"
        return self.redis.lrange(model_instance_key, 0, -1)

    def get_instance_models(self, instance_id: str) -> List[str]:
        """Get all models loaded on an instance.

        Args:
            instance_id: Instance ID

        Returns:
            List of model IDs
        """
        instance_key = f"{INSTANCE_MODELS_PREFIX}{instance_id}"
        instance_data_str = self.redis.get(instance_key)

        if instance_data_str:
            instance_data = json.loads(instance_data_str)
            return instance_data.get("models", [])
        return []

    def get_active_instances(self) -> Dict[str, Dict[str, Any]]:
        """Get all currently active instances.

        Returns:
            Dict mapping instance_id to instance data
        """
        pattern = f"{INSTANCE_MODELS_PREFIX}*"
        keys = self.redis.keys(pattern)

        instances = {}
        for key in keys:
            data_str = self.redis.get(key)
            if data_str:
                instance_data = json.loads(data_str)
                instances[instance_data["instance_id"]] = instance_data

        return instances

    def get_model_stats(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get statistics for a model across all instances.

        Args:
            model_id: Model ID

        Returns:
            Stats dict or None if model not tracked
        """
        stats_key = f"{MODEL_STATS_PREFIX}{model_id}"
        stats_str = self.redis.get(stats_key)

        if stats_str:
            return json.loads(stats_str)
        return None

    def get_all_model_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get statistics for all models.

        Returns:
            Dict mapping model_id to stats
        """
        pattern = f"{MODEL_STATS_PREFIX}*"
        keys = self.redis.keys(pattern)

        all_stats = {}
        for key in keys:
            stats_str = self.redis.get(key)
            if stats_str:
                stats = json.loads(stats_str)
                all_stats[stats["model_id"]] = stats

        return all_stats

    def heartbeat(self, instance_id: str) -> None:
        """Update instance heartbeat to indicate it's still alive.

        Args:
            instance_id: Instance ID
        """
        heartbeat_key = f"{INSTANCE_HEARTBEAT_PREFIX}{instance_id}"
        self.redis.setex(heartbeat_key, HEARTBEAT_TIMEOUT, datetime.utcnow().isoformat())

    def get_stale_instances(self) -> List[str]:
        """Get instances that haven't sent heartbeats.

        Returns:
            List of stale instance IDs
        """
        active_instances = self.get_active_instances()
        stale = []

        for instance_id in active_instances.keys():
            heartbeat_key = f"{INSTANCE_HEARTBEAT_PREFIX}{instance_id}"
            heartbeat = self.redis.get(heartbeat_key)
            if not heartbeat:
                stale.append(instance_id)

        return stale

    def cleanup_stale_instances(self) -> int:
        """Remove stale instances from tracking.

        Returns:
            Number of instances cleaned up
        """
        stale = self.get_stale_instances()

        for instance_id in stale:
            instance_key = f"{INSTANCE_MODELS_PREFIX}{instance_id}"
            self.redis.delete(instance_key)
            logger.info(f"Cleaned up stale instance {instance_id}")

        return len(stale)

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get overall cache statistics.

        Returns:
            Comprehensive cache stats
        """
        instances = self.get_active_instances()
        model_stats = self.get_all_model_stats()

        total_models_loaded = 0
        total_instance_capacity = 0.0
        total_model_size_mb = 0.0

        for instance in instances.values():
            total_models_loaded += len(instance.get("models", []))
            total_instance_capacity += instance.get("max_memory_gb", 0)

        for stats in model_stats.values():
            total_model_size_mb += stats.get("size_mb", 0)

        return {
            "total_instances": len(instances),
            "active_instances": [i["instance_id"] for i in instances.values()],
            "total_models_loaded": total_models_loaded,
            "total_unique_models": len(model_stats),
            "total_instance_capacity_gb": round(total_instance_capacity, 2),
            "total_model_size_mb": round(total_model_size_mb, 2),
            "capacity_utilization_percent": round(
                (total_model_size_mb / (total_instance_capacity * 1024)) * 100, 2
            )
            if total_instance_capacity > 0
            else 0,
        }


# Singleton instance
model_cache = ModelCache()
