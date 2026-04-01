"""React hooks for interacting with the training service."""

import asyncio
from typing import Optional, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)


class TrainingServiceClient:
    """Client for communicating with the training service backend."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        """Initialize training service client.

        Args:
            base_url: Base URL of training service (default: localhost:8000)
        """
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v1/training"

    async def log_completion_event(
        self,
        prompt: str,
        completion: str,
        language: str = "python",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Log a completion event for training data collection.

        Args:
            prompt: Input prompt
            completion: Generated completion
            language: Programming language (default: python)
            metadata: Optional metadata (model_id, latency, tokens, etc)

        Returns:
            API response
        """
        import aiohttp

        payload = {
            "prompt": prompt,
            "completion": completion,
            "language": language,
            "metadata": metadata or {},
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.api_base}/event",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        logger.warning(f"Failed to log completion: {resp.status}")
                        return {"error": f"HTTP {resp.status}"}
            except asyncio.TimeoutError:
                logger.warning("Training service timeout")
                return {"error": "timeout"}
            except Exception as e:
                logger.error(f"Failed to communicate with training service: {e}")
                return {"error": str(e)}

    async def get_training_status(self) -> Dict[str, Any]:
        """Get current training status.

        Returns:
            {
              "model_id": "mistral-7b",
              "active_cycle": "quick",
              "quick_train_count": 25,
              "last_quick_train": "2026-04-02T12:30:00",
              "next_full_train_in": 23,  # quick trains until next full cycle
              "current_best_adapter": "mistral-7b_quick_24",
              "metrics": {...}
            }
        """
        import aiohttp

        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{self.api_base}/status",
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        return {"error": f"HTTP {resp.status}"}
            except Exception as e:
                logger.error(f"Failed to get training status: {e}")
                return {"error": str(e)}

    async def get_model_version(self, model_id: str = "mistral-7b") -> Dict[str, Any]:
        """Get current active model version.

        Args:
            model_id: Model identifier

        Returns:
            {
              "version_id": "v_1712149200",
              "adapter_id": "mistral-7b_full_0",
              "status": "production",
              "quality_score": 0.92,
              "promoted_at": "2026-04-02T14:00:00"
            }
        """
        import aiohttp

        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{self.api_base}/version/{model_id}",
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        return {"error": f"HTTP {resp.status}"}
            except Exception as e:
                logger.error(f"Failed to get model version: {e}")
                return {"error": str(e)}


# Global client instance
_training_client: Optional[TrainingServiceClient] = None


def get_training_client(base_url: str = "http://localhost:8000") -> TrainingServiceClient:
    """Get or create training service client.

    Args:
        base_url: Base URL of training service

    Returns:
        TrainingServiceClient instance
    """
    global _training_client
    if _training_client is None:
        _training_client = TrainingServiceClient(base_url)
    return _training_client
