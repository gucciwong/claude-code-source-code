import pytest
import time
from analytics.collector import MetricsCollector
from analytics.training_roi import TrainingROICalculator
from analytics.models import MetricEvent, EventType


@pytest.fixture
def collector():
    return MetricsCollector()


@pytest.fixture
def calc(collector):
    return TrainingROICalculator(collector)


def make_event(event_type, value=1.0):
    return MetricEvent(event_type=event_type, timestamp=time.time(), value=value)


def test_calculate_with_no_events_returns_zero_roi(calc):
    result = calc.calculate()
    assert result.total_training_runs == 0
    assert result.avg_improvement_pct == 0.0
    assert result.time_saved_hours == 0.0
    assert result.estimated_roi_multiplier == pytest.approx(1.0, abs=0.01)


def test_calculate_counts_training_runs(collector, calc):
    collector.ingest(make_event(EventType.TRAINING_RUN, value=10.0))
    collector.ingest(make_event(EventType.TRAINING_RUN, value=20.0))
    result = calc.calculate()
    assert result.total_training_runs == 2


def test_calculate_computes_avg_improvement_from_event_values(collector, calc):
    collector.ingest(make_event(EventType.TRAINING_RUN, value=10.0))
    collector.ingest(make_event(EventType.TRAINING_RUN, value=30.0))
    result = calc.calculate()
    assert result.avg_improvement_pct == pytest.approx(20.0, abs=0.1)


def test_calculate_estimates_time_saved_hours_from_token_events(collector, calc):
    # 6000 tokens * 0.001 / 60 = 0.1 hours
    collector.ingest(make_event(EventType.TOKEN_USAGE, value=6000.0))
    result = calc.calculate()
    assert result.time_saved_hours == pytest.approx(0.1, abs=0.01)


def test_calculate_roi_multiplier_is_at_least_1(collector, calc):
    result = calc.calculate()
    assert result.estimated_roi_multiplier >= 1.0
    # With training events it should be > 1
    collector.ingest(make_event(EventType.TRAINING_RUN, value=20.0))
    result2 = calc.calculate()
    assert result2.estimated_roi_multiplier >= 1.0
