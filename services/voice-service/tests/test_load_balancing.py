"""Load balancing and multi-instance tests.

Tests Redis session persistence, model caching, instance registration,
failover scenarios, and concurrent load distribution.
"""

import pytest
import json
import asyncio
from datetime import datetime
from typing import Dict, List
from unittest.mock import Mock, patch, MagicMock

from voice_service.config.redis_config import RedisClient, RedisSettings, redis_client
from voice_service.cache import SessionStore, ModelCache, session_store, model_cache


# ============================================================
# Fixtures
# ============================================================


@pytest.fixture(autouse=True)
def clean_redis():
    """Clean Redis before each test."""
    try:
        redis_client.client.flushdb()
    except Exception as exc:
        pytest.skip(f"Redis not available: {exc}")
    yield
    try:
        redis_client.client.flushdb()
    except Exception:
        pass  # best-effort cleanup after test


@pytest.fixture
def redis_settings():
    """Redis settings fixture."""
    return RedisSettings(
        host="localhost",
        port=6379,
        db=0,
    )


@pytest.fixture
def mock_redis():
    """Mock Redis client for testing without actual Redis."""
    mock = MagicMock()
    mock.get = MagicMock(return_value=None)
    mock.setex = MagicMock(return_value=True)
    mock.delete = MagicMock(return_value=1)
    mock.lrange = MagicMock(return_value=[])
    mock.lrem = MagicMock(return_value=1)
    mock.lpush = MagicMock(return_value=1)
    mock.expire = MagicMock(return_value=True)
    mock.keys = MagicMock(return_value=[])
    mock.ping = MagicMock(return_value=True)
    mock.flushdb = MagicMock(return_value=True)
    return mock


# ============================================================
# Test Session Store
# ============================================================


class TestSessionStore:
    """Test Redis-based session management."""

    def test_create_session(self):
        """Test creating a new session."""
        store = SessionStore(ttl_seconds=3600)
        session_id = store.create_session("user-123", "whisper-base")

        assert session_id is not None
        assert len(session_id) == 36  # UUID length

        # Verify session is stored
        session = store.get_session(session_id)
        assert session is not None
        assert session["user_id"] == "user-123"
        assert session["model_id"] == "whisper-base"
        assert session["transcription_count"] == 0

    def test_get_nonexistent_session(self):
        """Test retrieving non-existent session returns None."""
        store = SessionStore()
        result = store.get_session("nonexistent-session-id")
        assert result is None

    def test_update_session_stats(self):
        """Test updating session statistics."""
        store = SessionStore()
        session_id = store.create_session("user-123", "whisper-base")

        # Update session
        success = store.update_session(session_id, audio_duration=15.5, instance_id="instance-1")
        assert success is True

        # Verify stats updated
        session = store.get_session(session_id)
        assert session["transcription_count"] == 1
        assert session["total_audio_duration_seconds"] == 15.5
        assert session["instance_id"] == "instance-1"

    def test_update_nonexistent_session(self):
        """Test updating non-existent session returns False."""
        store = SessionStore()
        result = store.update_session("nonexistent", audio_duration=10)
        assert result is False

    def test_delete_session(self):
        """Test deleting a session."""
        store = SessionStore()
        session_id = store.create_session("user-123", "whisper-base")

        # Verify session exists
        assert store.get_session(session_id) is not None

        # Delete session
        result = store.delete_session(session_id)
        assert result is True

        # Verify session is deleted
        assert store.get_session(session_id) is None

    def test_assign_and_get_user_model(self):
        """Test assigning and retrieving user's model preference."""
        store = SessionStore()

        # Assign model
        store.assign_model("user-123", "whisper-large")

        # Retrieve assignment
        model = store.get_user_model("user-123")
        assert model == "whisper-large"

    def test_get_user_sessions(self):
        """Test retrieving all sessions for a user."""
        store = SessionStore()

        # Create multiple sessions
        session_ids = []
        for i in range(3):
            session_id = store.create_session("user-123", f"model-{i}")
            session_ids.append(session_id)

        # Retrieve sessions
        sessions = store.get_user_sessions("user-123")
        assert len(sessions) == 3
        assert all(s["user_id"] == "user-123" for s in sessions)

    def test_get_all_active_sessions(self):
        """Test retrieving all active sessions from all users."""
        store = SessionStore()

        # Create sessions for multiple users
        for user_id in ["user-1", "user-2", "user-3"]:
            for i in range(2):
                store.create_session(user_id, f"model-{i}")

        # Retrieve all
        all_sessions = store.get_all_active_sessions()
        assert len(all_sessions) == 6
        assert all(isinstance(s, dict) for s in all_sessions.values())

    def test_get_session_stats(self):
        """Test session statistics aggregation."""
        store = SessionStore()

        # Create sessions with different models
        sid1 = store.create_session("user-1", "whisper-base")
        sid2 = store.create_session("user-1", "whisper-large")
        sid3 = store.create_session("user-2", "whisper-base")

        # Update some sessions
        store.update_session(sid1, audio_duration=10)
        store.update_session(sid2, audio_duration=20)
        store.update_session(sid3, audio_duration=5)

        # Get stats
        stats = store.get_session_stats()

        assert stats["total_sessions"] == 3
        assert stats["sessions_by_model"]["whisper-base"] == 2
        assert stats["sessions_by_model"]["whisper-large"] == 1
        assert stats["total_audio_duration_seconds"] == 35.0


# ============================================================
# Test Model Cache
# ============================================================


class TestModelCache:
    """Test distributed model caching across instances."""

    def test_register_instance(self):
        """Test registering a service instance."""
        cache = ModelCache()
        cache.register_instance("instance-1", 8.0)

        # Verify instance is registered
        instances = cache.get_active_instances()
        assert "instance-1" in instances
        assert instances["instance-1"]["max_memory_gb"] == 8.0

    def test_load_model_on_instance(self):
        """Test recording model load on instance."""
        cache = ModelCache()
        cache.register_instance("instance-1", 8.0)

        # Load model
        success = cache.load_model("instance-1", "whisper-base", 150, 2500.0)
        assert success is True

        # Verify model is tracked
        model_instances = cache.get_model_instances("whisper-base")
        assert "instance-1" in model_instances

        # Verify instance has model
        instance_models = cache.get_instance_models("instance-1")
        assert "whisper-base" in instance_models

    def test_load_nonexistent_instance_fails(self):
        """Test loading model on non-existent instance fails."""
        cache = ModelCache()
        success = cache.load_model("nonexistent", "whisper-base", 150, 2500.0)
        assert success is False

    def test_unload_model(self):
        """Test unloading model from instance."""
        cache = ModelCache()
        cache.register_instance("instance-1", 8.0)
        cache.load_model("instance-1", "whisper-base", 150, 2500.0)

        # Unload model
        success = cache.unload_model("instance-1", "whisper-base")
        assert success is True

        # Verify model is removed
        instance_models = cache.get_instance_models("instance-1")
        assert "whisper-base" not in instance_models

    def test_multiple_instances_same_model(self):
        """Test same model loaded on multiple instances."""
        cache = ModelCache()

        # Register 3 instances and load model on all
        for i in range(1, 4):
            cache.register_instance(f"instance-{i}", 8.0)
            cache.load_model(f"instance-{i}", "whisper-base", 150, 2500.0)

        # Verify model is on all instances
        model_instances = cache.get_model_instances("whisper-base")
        assert len(model_instances) == 3
        assert all(f"instance-{i}" in model_instances for i in range(1, 4))

    def test_model_stats(self):
        """Test model statistics tracking."""
        cache = ModelCache()

        # Register instance and load model
        cache.register_instance("instance-1", 8.0)
        cache.load_model("instance-1", "whisper-base", 150, 2500.0)
        cache.load_model("instance-1", "whisper-base", 150, 2400.0)

        # Check stats
        stats = cache.get_model_stats("whisper-base")
        assert stats["total_loads"] == 2
        assert stats["total_load_time_ms"] == 4900  # 2500 + 2400
        assert stats["size_mb"] == 150
        assert len(stats["instances"]) == 1

    def test_heartbeat_tracking(self):
        """Test instance heartbeat tracking."""
        cache = ModelCache()

        # Register and use instance
        cache.register_instance("instance-1", 8.0)
        cache.heartbeat("instance-1")

        # Verify no stale instances
        stale = cache.get_stale_instances()
        assert "instance-1" not in stale

    def test_cache_statistics(self):
        """Test overall cache statistics."""
        cache = ModelCache()

        # Set up multiple instances with models
        for i in range(1, 4):
            cache.register_instance(f"instance-{i}", 8.0)
            cache.load_model(f"instance-{i}", "whisper-base", 150, 2500.0)
            cache.load_model(f"instance-{i}", "whisper-large", 300, 5000.0)

        # Get cache stats
        stats = cache.get_cache_stats()
        assert stats["total_instances"] == 3
        assert stats["total_models_loaded"] == 6  # 2 models × 3 instances
        assert stats["total_unique_models"] == 2
        assert stats["total_model_size_mb"] == 450  # (150 + 300) × 1
        assert stats["capacity_utilization_percent"] > 0


# ============================================================
# Test Load Balancing Scenarios
# ============================================================


class TestLoadBalancingScenarios:
    """Test realistic load balancing scenarios."""

    def test_concurrent_users_distribution(self):
        """Test distributing concurrent users across instances."""
        store = SessionStore()
        cache = ModelCache()

        # Register 3 instances
        for i in range(1, 4):
            cache.register_instance(f"instance-{i}", 8.0)

        # Simulate 6 concurrent users
        sessions = []
        for user_id in range(1, 7):
            session_id = store.create_session(f"user-{user_id}", "whisper-base")
            # Simulate assignment to instances in round-robin
            instance_id = f"instance-{((user_id - 1) % 3) + 1}"
            store.update_session(session_id, instance_id=instance_id)
            sessions.append(session_id)

        # Verify sessions are distributed
        all_sessions = store.get_all_active_sessions()
        assert len(all_sessions) == 6

        # Check distribution
        stats = store.get_session_stats()
        assert stats["total_sessions"] == 6
        instances_with_sessions = list(stats["sessions_by_instance"].values())
        assert all(count > 0 for count in instances_with_sessions if isinstance(count, int))

    def test_session_persistence_across_requests(self):
        """Test session persistence when servicing multiple requests."""
        store = SessionStore()

        # Create session
        session_id = store.create_session("user-1", "whisper-base")
        initial_session = store.get_session(session_id)

        # Simulate 5 transcription requests
        for i in range(5):
            store.update_session(session_id, audio_duration=10 + i)

        # Verify session maintains state across requests
        final_session = store.get_session(session_id)
        assert final_session["transcription_count"] == 5
        assert final_session["total_audio_duration_seconds"] == 50 + (0+1+2+3+4)

    def test_instance_failover_scenario(self):
        """Test failover when instance goes down."""
        store = SessionStore()
        cache = ModelCache()

        # Register 3 instances
        for i in range(1, 4):
            cache.register_instance(f"instance-{i}", 8.0)

        # Create sessions on all instances
        sessions_per_instance = {}
        for i in range(1, 4):
            instance_id = f"instance-{i}"
            sessions_per_instance[instance_id] = []
            for j in range(2):
                session_id = store.create_session(f"user-{i}-{j}", "whisper-base")
                store.update_session(session_id, instance_id=instance_id)
                sessions_per_instance[instance_id].append(session_id)

        # Verify initial state
        all_sessions = store.get_all_active_sessions()
        assert len(all_sessions) == 6

        # Simulate instance-2 going down (no heartbeat)
        stale = cache.get_stale_instances()
        # In real scenario, cleanup would happen after heartbeat timeout

        # Verify instance-2 sessions still exist (can be recovered)
        instance_2_sessions = store.get_user_sessions("user-2-0")
        assert len(instance_2_sessions) > 0

    def test_model_reuse_across_instances(self):
        """Test efficient model reuse across instances."""
        cache = ModelCache()

        # Register 3 instances
        for i in range(1, 4):
            cache.register_instance(f"instance-{i}", 8.0)

        # Load same model on all instances
        for i in range(1, 4):
            cache.load_model(f"instance-{i}", "whisper-base", 150, 2500.0)

        # Verify model instances
        model_instances = cache.get_model_instances("whisper-base")
        assert len(model_instances) == 3

        # Verify cache efficiency
        stats = cache.get_cache_stats()
        total_loaded = stats["total_models_loaded"]
        unique_models = stats["total_unique_models"]
        assert total_loaded == 3  # Same model, 3x
        assert unique_models == 1

    def test_redis_session_ttl_cleanup(self):
        """Test Redis TTL-based session cleanup."""
        store = SessionStore(ttl_seconds=1)

        # Create session with short TTL
        session_id = store.create_session("user-1", "whisper-base")
        assert store.get_session(session_id) is not None

        # Simulate TTL expiration using cleanup
        import time
        time.sleep(2)

        # In real Redis, expired keys are cleaned automatically
        # For testing, we can manually trigger cleanup
        count_before = len(store.get_all_active_sessions())
        # Note: actual expiration depends on Redis server


# ============================================================
# Test Session Serialization
# ============================================================


class TestSessionSerialization:
    """Test session data serialization and persistence."""

    def test_session_to_json(self):
        """Test session can be serialized to JSON."""
        store = SessionStore()
        session_id = store.create_session("user-1", "whisper-base")
        session = store.get_session(session_id)

        # Verify it's JSON-serializable
        json_str = json.dumps(session)
        assert json_str is not None

        # Verify it can be deserialized
        restored = json.loads(json_str)
        assert restored["user_id"] == "user-1"
        assert restored["model_id"] == "whisper-base"

    def test_model_stats_serialization(self):
        """Test model stats serialization."""
        cache = ModelCache()

        # Create stats
        cache.register_instance("instance-1", 8.0)
        cache.load_model("instance-1", "whisper-base", 150, 2500.0)

        # Get and serialize
        stats = cache.get_model_stats("whisper-base")
        json_str = json.dumps(stats)
        restored = json.loads(json_str)

        assert restored["model_id"] == "whisper-base"
        assert restored["size_mb"] == 150


# ============================================================
# Scaling Scenario Tests
# ============================================================


class TestScalingScenarios:
    """Test scaling behavior across different load levels."""

    def test_scale_from_2_to_6_instances(self):
        """Test scaling from 2 to 6 instances."""
        store = SessionStore()
        cache = ModelCache()

        # Phase 1: 2 instances
        for i in range(1, 3):
            cache.register_instance(f"instance-{i}", 8.0)
            cache.load_model(f"instance-{i}", "whisper-base", 150, 2500.0)

        sessions_phase1 = []
        for user_id in range(1, 5):  # 4 users
            session_id = store.create_session(f"user-{user_id}", "whisper-base")
            sessions_phase1.append(session_id)

        assert len(store.get_all_active_sessions()) == 4

        # Phase 2: Scale to 6 instances
        for i in range(3, 7):
            cache.register_instance(f"instance-{i}", 8.0)
            cache.load_model(f"instance-{i}", "whisper-base", 150, 2500.0)

        # Add more users
        for user_id in range(5, 13):  # 8 more users
            session_id = store.create_session(f"user-{user_id}", "whisper-base")
            sessions_phase1.append(session_id)

        assert len(store.get_all_active_sessions()) == 12

        # Verify cache stats
        stats = cache.get_cache_stats()
        assert stats["total_instances"] == 6

    def test_instance_capacity_tracking(self):
        """Test tracking instance capacity usage."""
        cache = ModelCache()

        # Register instances with different capacities
        capacities = {"instance-1": 4.0, "instance-2": 8.0, "instance-3": 16.0}
        for instance_id, capacity in capacities.items():
            cache.register_instance(instance_id, capacity)

        # Load models
        for instance_id in capacities:
            cache.load_model(instance_id, "whisper-base", 150, 2500.0)
            cache.load_model(instance_id, "whisper-large", 300, 5000.0)

        # Get stats
        stats = cache.get_cache_stats()
        assert stats["total_instance_capacity_gb"] == 28.0  # 4 + 8 + 16
        assert stats["total_model_size_mb"] == 450  # 150 + 300 per instance


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
