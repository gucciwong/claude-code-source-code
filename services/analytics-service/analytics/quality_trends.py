import time
from datetime import datetime
from typing import List
from collections import defaultdict
from .models import QualityTrend, EventType
from .collector import MetricsCollector

class QualityTrendAnalyzer:
    def __init__(self, collector: MetricsCollector):
        self._collector = collector

    def analyze(self, days: int = 7) -> List[QualityTrend]:
        """Group pattern_saved events by day and compute avg quality score (value field)."""
        pattern_events = self._collector.get_events(event_type=EventType.PATTERN_SAVED)

        if not pattern_events:
            # Return stub data for empty state
            now = time.time()
            trends = []
            for i in range(days):
                ts = now - (days - 1 - i) * 86400
                dt = datetime.fromtimestamp(ts)
                trends.append(QualityTrend(
                    date_label=dt.strftime('%Y-%m-%d'),
                    avg_quality_score=0.0,
                    pattern_count=0
                ))
            return trends

        # Group by day
        by_day: dict = defaultdict(list)
        for event in pattern_events:
            dt = datetime.fromtimestamp(event.timestamp)
            day_key = dt.strftime('%Y-%m-%d')
            by_day[day_key].append(event.value)

        trends = []
        for day_key in sorted(by_day.keys()):
            scores = by_day[day_key]
            trends.append(QualityTrend(
                date_label=day_key,
                avg_quality_score=round(sum(scores) / len(scores), 2),
                pattern_count=len(scores)
            ))
        return trends
