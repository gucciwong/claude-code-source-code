import pytest
import time
from datetime import datetime
from analytics.collector import MetricsCollector
from analytics.quality_trends import QualityTrendAnalyzer
from analytics.models import MetricEvent, EventType


@pytest.fixture
def collector():
    return MetricsCollector()


@pytest.fixture
def analyzer(collector):
    return QualityTrendAnalyzer(collector)


def make_pattern_event(value=0.8, timestamp=None):
    return MetricEvent(
        event_type=EventType.PATTERN_SAVED,
        timestamp=timestamp or time.time(),
        value=value,
    )


def test_analyze_with_no_events_returns_7_day_stub(analyzer):
    trends = analyzer.analyze()
    assert len(trends) == 7
    for t in trends:
        assert t.avg_quality_score == 0.0
        assert t.pattern_count == 0


def test_analyze_groups_pattern_saved_events_by_day(collector, analyzer):
    now = time.time()
    day1 = now - 86400
    day2 = now
    collector.ingest(make_pattern_event(timestamp=day1))
    collector.ingest(make_pattern_event(timestamp=day2))
    trends = analyzer.analyze()
    assert len(trends) == 2


def test_analyze_computes_avg_quality_score_per_day(collector, analyzer):
    now = time.time()
    collector.ingest(make_pattern_event(value=0.8, timestamp=now))
    collector.ingest(make_pattern_event(value=0.6, timestamp=now))
    trends = analyzer.analyze()
    assert len(trends) == 1
    assert trends[0].avg_quality_score == pytest.approx(0.7, abs=0.01)


def test_analyze_returns_trends_sorted_by_date(collector, analyzer):
    now = time.time()
    collector.ingest(make_pattern_event(timestamp=now))
    collector.ingest(make_pattern_event(timestamp=now - 2 * 86400))
    collector.ingest(make_pattern_event(timestamp=now - 86400))
    trends = analyzer.analyze()
    date_labels = [t.date_label for t in trends]
    assert date_labels == sorted(date_labels)


def test_analyze_merges_same_day_events(collector, analyzer):
    # Two events with the same day timestamp
    day_ts = time.time()
    collector.ingest(make_pattern_event(value=0.9, timestamp=day_ts))
    collector.ingest(make_pattern_event(value=0.7, timestamp=day_ts + 3600))  # 1 hour later — same day
    trends = analyzer.analyze()
    # Should be grouped into 1 day
    day_label = datetime.fromtimestamp(day_ts).strftime('%Y-%m-%d')
    matching = [t for t in trends if t.date_label == day_label]
    assert len(matching) == 1
    assert matching[0].pattern_count == 2
    assert matching[0].avg_quality_score == pytest.approx(0.8, abs=0.01)
