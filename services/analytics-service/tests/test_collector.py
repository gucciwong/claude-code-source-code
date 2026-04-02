import pytest
import time
from analytics.collector import MetricsCollector
from analytics.models import MetricEvent, EventType


@pytest.fixture
def collector():
    c = MetricsCollector()
    return c


def make_event(event_type=EventType.CHAT_SESSION, timestamp=None, value=1.0):
    return MetricEvent(
        event_type=event_type,
        timestamp=timestamp or time.time(),
        value=value,
    )


def test_ingest_returns_string_id(collector):
    event = make_event()
    event_id = collector.ingest(event)
    assert isinstance(event_id, str)
    assert len(event_id) > 0


def test_get_all_events_returns_all_ingested(collector):
    e1 = make_event(EventType.CHAT_SESSION)
    e2 = make_event(EventType.TOKEN_USAGE)
    collector.ingest(e1)
    collector.ingest(e2)
    all_events = collector.get_all_events()
    assert len(all_events) == 2


def test_get_events_filtered_by_event_type(collector):
    collector.ingest(make_event(EventType.CHAT_SESSION))
    collector.ingest(make_event(EventType.TOKEN_USAGE))
    collector.ingest(make_event(EventType.CHAT_SESSION))
    chat_events = collector.get_events(event_type=EventType.CHAT_SESSION)
    assert len(chat_events) == 2
    for e in chat_events:
        assert e.event_type == EventType.CHAT_SESSION


def test_get_events_filtered_by_timestamp_range(collector):
    now = time.time()
    collector.ingest(make_event(timestamp=now - 200))
    collector.ingest(make_event(timestamp=now - 100))
    collector.ingest(make_event(timestamp=now))
    events = collector.get_events(start=now - 150)
    assert len(events) == 2


def test_clear_empties_store(collector):
    collector.ingest(make_event())
    collector.ingest(make_event())
    collector.clear()
    assert len(collector.get_all_events()) == 0
