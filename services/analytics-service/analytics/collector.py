import time
import uuid
from typing import List, Optional
from .models import MetricEvent, EventType

class MetricsCollector:
    """In-memory event store (SQLite-backed in production; in-memory for testing)."""

    def __init__(self):
        self._events: List[MetricEvent] = []

    def ingest(self, event: MetricEvent) -> str:
        event_id = str(uuid.uuid4())
        self._events.append(event)
        return event_id

    def get_events(self, event_type: Optional[EventType] = None, start: Optional[float] = None, end: Optional[float] = None) -> List[MetricEvent]:
        events = self._events
        if event_type:
            events = [e for e in events if e.event_type == event_type]
        if start:
            events = [e for e in events if e.timestamp >= start]
        if end:
            events = [e for e in events if e.timestamp <= end]
        return events

    def get_all_events(self) -> List[MetricEvent]:
        return list(self._events)

    def clear(self):
        self._events = []
