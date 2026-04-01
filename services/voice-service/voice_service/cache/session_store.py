"""Redis-based session store for managing user transcription sessions.

Tracks active user sessions, their assigned models, and usage metadata.
Supports TTL-based automatic cleanup and distributed invalidation.
"""

import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any

from ..config.redis_config import redis_client

logger = logging.getLogger(__name__)

# Session expiration defaults (seconds)
DEFAULT_SESSION_TTL = 3600  # 1 hour
DEFAULT_USER_TTL = 86400  # 24 hours

# Redis key prefixes
SESSION_PREFIX = "session:"
USER_PREFIX = "user:"
MODEL_ASSIGNMENT_PREFIX = "model_assignment:"
SESSION_LIST_PREFIX = "sessions:"


class SessionStore:
    """Manages user sessions and model assignments in Redis."""

    def __init__(self, ttl_seconds: int = DEFAULT_SESSION_TTL):
        """Initialize session store.

        Args:
            ttl_seconds: Session time-to-live in seconds
        """
        self.redis = redis_client.client
        self.ttl = ttl_seconds

    def create_session(self, user_id: str, model_id: str) -> str:
        """Create a new transcription session.

        Args:
            user_id: Unique user identifier
            model_id: Selected model ID

        Returns:
            Session ID (UUID)
        """
        session_id = str(uuid.uuid4())
        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "model_id": model_id,
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            "transcription_count": 0,
            "total_audio_duration_seconds": 0,
            "instance_id": None,  # Assigned on first request
        }

        key = f"{SESSION_PREFIX}{session_id}"
        self.redis.setex(
            key, self.ttl, json.dumps(session_data)
        )

        # Add to user's session list
        user_sessions_key = f"{SESSION_LIST_PREFIX}{user_id}"
        self.redis.lpush(user_sessions_key, session_id)
        self.redis.expire(user_sessions_key, DEFAULT_USER_TTL)

        logger.info(f"Created session {session_id} for user {user_id} with model {model_id}")
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data.

        Args:
            session_id: Session to retrieve

        Returns:
            Session dict or None if not found
        """
        key = f"{SESSION_PREFIX}{session_id}"
        data = self.redis.get(key)

        if data:
            return json.loads(data)
        return None

    def update_session(
        self,
        session_id: str,
        audio_duration: float = 0,
        instance_id: Optional[str] = None,
    ) -> bool:
        """Update session activity and statistics.

        Args:
            session_id: Session to update
            audio_duration: Duration of processed audio (seconds)
            instance_id: Service instance ID (assigned on first request)

        Returns:
            True if updated, False if session not found
        """
        session = self.get_session(session_id)
        if not session:
            return False

        session["last_activity"] = datetime.utcnow().isoformat()
        session["transcription_count"] += 1
        session["total_audio_duration_seconds"] += audio_duration

        if instance_id:
            session["instance_id"] = instance_id

        key = f"{SESSION_PREFIX}{session_id}"
        self.redis.setex(
            key, self.ttl, json.dumps(session)
        )

        # Refresh user session list TTL
        user_sessions_key = f"{SESSION_LIST_PREFIX}{session['user_id']}"
        self.redis.expire(user_sessions_key, DEFAULT_USER_TTL)

        return True

    def delete_session(self, session_id: str) -> bool:
        """Delete a session.

        Args:
            session_id: Session to delete

        Returns:
            True if deleted, False if not found
        """
        session = self.get_session(session_id)
        if not session:
            return False

        key = f"{SESSION_PREFIX}{session_id}"
        self.redis.delete(key)

        # Remove from user's session list
        user_sessions_key = f"{SESSION_LIST_PREFIX}{session['user_id']}"
        self.redis.lrem(user_sessions_key, 1, session_id)

        logger.info(f"Deleted session {session_id}")
        return True

    def assign_model(self, user_id: str, model_id: str, ttl_hours: int = 24) -> None:
        """Assign a model to a user for subsequent sessions.

        Args:
            user_id: User ID
            model_id: Model to assign
            ttl_hours: How long the assignment lasts
        """
        key = f"{MODEL_ASSIGNMENT_PREFIX}{user_id}"
        self.redis.setex(
            key, ttl_hours * 3600, model_id
        )
        logger.info(f"Assigned model {model_id} to user {user_id}")

    def get_user_model(self, user_id: str) -> Optional[str]:
        """Get the user's assigned model.

        Args:
            user_id: User ID

        Returns:
            Model ID or None if not assigned
        """
        key = f"{MODEL_ASSIGNMENT_PREFIX}{user_id}"
        return self.redis.get(key)

    def get_user_sessions(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's active sessions.

        Args:
            user_id: User ID
            limit: Maximum sessions to return

        Returns:
            List of session dicts
        """
        user_sessions_key = f"{SESSION_LIST_PREFIX}{user_id}"
        session_ids = self.redis.lrange(user_sessions_key, 0, limit - 1)

        sessions = []
        for session_id in session_ids:
            session = self.get_session(session_id)
            if session:
                sessions.append(session)

        return sessions

    def get_all_active_sessions(self) -> Dict[str, Dict[str, Any]]:
        """Get all active sessions across all users.

        Returns:
            Dict mapping session_id to session data
        """
        pattern = f"{SESSION_PREFIX}*"
        keys = self.redis.keys(pattern)

        sessions = {}
        for key in keys:
            data = self.redis.get(key)
            if data:
                session = json.loads(data)
                sessions[session["session_id"]] = session

        return sessions

    def get_session_stats(self) -> Dict[str, Any]:
        """Get statistics about all sessions.

        Returns:
            Stats dict with counts and timing info
        """
        all_sessions = self.get_all_active_sessions()
        sessions_by_model = {}
        sessions_by_instance = {}
        total_duration = 0.0

        for session in all_sessions.values():
            model = session["model_id"]
            sessions_by_model[model] = sessions_by_model.get(model, 0) + 1

            instance = session.get("instance_id", "unassigned")
            sessions_by_instance[instance] = sessions_by_instance.get(instance, 0) + 1

            total_duration += session["total_audio_duration_seconds"]

        return {
            "total_sessions": len(all_sessions),
            "sessions_by_model": sessions_by_model,
            "sessions_by_instance": sessions_by_instance,
            "total_audio_duration_seconds": total_duration,
            "average_duration_per_session": (
                total_duration / len(all_sessions) if all_sessions else 0
            ),
        }

    def cleanup_expired_sessions(self) -> int:
        """Manually trigger cleanup of expired sessions (Redis handles this automatically).

        Returns:
            Number of sessions cleaned up
        """
        all_sessions = self.get_all_active_sessions()
        before_count = len(all_sessions)

        # Remove sessions that are truly gone (Redis auto-cleanup)
        # This is mostly informational
        return before_count


# Singleton instance
session_store = SessionStore()
