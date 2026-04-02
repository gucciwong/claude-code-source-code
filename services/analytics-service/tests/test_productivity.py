import pytest
import time
from analytics.collector import MetricsCollector
from analytics.productivity import ProductivityMetricsCalculator
from analytics.models import MetricEvent, EventType


@pytest.fixture
def collector():
    return MetricsCollector()


@pytest.fixture
def calc(collector):
    return ProductivityMetricsCalculator(collector)


def make_event(event_type, value=1.0):
    return MetricEvent(event_type=event_type, timestamp=time.time(), value=value)


def test_calculate_with_no_events_returns_zero_metrics(calc):
    result = calc.calculate()
    assert result.total_sessions == 0
    assert result.total_tokens == 0.0
    assert result.avg_tokens_per_session == 0.0
    assert result.total_code_reviews == 0
    assert result.total_training_runs == 0
    assert result.acceptance_rate == 0.0


def test_calculate_counts_chat_sessions(collector, calc):
    collector.ingest(make_event(EventType.CHAT_SESSION))
    collector.ingest(make_event(EventType.CHAT_SESSION))
    result = calc.calculate()
    assert result.total_sessions == 2


def test_calculate_sums_token_events(collector, calc):
    collector.ingest(make_event(EventType.TOKEN_USAGE, value=500.0))
    collector.ingest(make_event(EventType.TOKEN_USAGE, value=300.0))
    result = calc.calculate()
    assert result.total_tokens == 800.0


def test_calculate_computes_avg_tokens_per_session(collector, calc):
    collector.ingest(make_event(EventType.CHAT_SESSION))
    collector.ingest(make_event(EventType.TOKEN_USAGE, value=200.0))
    collector.ingest(make_event(EventType.TOKEN_USAGE, value=400.0))
    result = calc.calculate()
    # 1 session, 600 tokens → 600.0
    assert result.avg_tokens_per_session == 600.0


def test_calculate_returns_acceptance_rate_zero_when_no_token_events(collector, calc):
    collector.ingest(make_event(EventType.CHAT_SESSION))
    result = calc.calculate()
    assert result.acceptance_rate == 0.0
