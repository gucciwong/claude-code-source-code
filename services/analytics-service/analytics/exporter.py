import time
import json
import csv
import io
from .models import AnalyticsReport
from .collector import MetricsCollector
from .productivity import ProductivityMetricsCalculator
from .quality_trends import QualityTrendAnalyzer
from .training_roi import TrainingROICalculator

class ReportExporter:
    def __init__(self, collector: MetricsCollector):
        self._collector = collector
        self._productivity = ProductivityMetricsCalculator(collector)
        self._quality = QualityTrendAnalyzer(collector)
        self._roi = TrainingROICalculator(collector)

    def build_report(self) -> AnalyticsReport:
        all_events = self._collector.get_all_events()
        return AnalyticsReport(
            generated_at=time.time(),
            total_events=len(all_events),
            productivity=self._productivity.calculate(),
            quality_trends=self._quality.analyze(),
            training_roi=self._roi.calculate()
        )

    def export_json(self) -> str:
        report = self.build_report()
        return report.model_dump_json(indent=2)

    def export_csv(self) -> str:
        all_events = self._collector.get_all_events()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['event_type', 'timestamp', 'value'])
        for event in all_events:
            writer.writerow([event.event_type.value, event.timestamp, event.value])
        return output.getvalue()
