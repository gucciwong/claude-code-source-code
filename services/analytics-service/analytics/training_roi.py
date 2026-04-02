from .models import TrainingROI, EventType
from .collector import MetricsCollector

class TrainingROICalculator:
    def __init__(self, collector: MetricsCollector):
        self._collector = collector

    def calculate(self) -> TrainingROI:
        training_events = self._collector.get_events(event_type=EventType.TRAINING_RUN)
        token_events = self._collector.get_events(event_type=EventType.TOKEN_USAGE)

        total_runs = len(training_events)

        # Improvement: average of training event values (simulated quality improvement %)
        avg_improvement = sum(e.value for e in training_events) / total_runs if total_runs > 0 else 0.0

        # Time saved: tokens * 0.001 minutes estimated = hours
        total_tokens = sum(e.value for e in token_events)
        time_saved_hours = round(total_tokens * 0.001 / 60, 2)

        # ROI multiplier: 1 + (improvement / 10) * training_runs weight
        roi = 1.0 + (avg_improvement / 100.0) * min(total_runs, 10) * 0.5

        return TrainingROI(
            total_training_runs=total_runs,
            avg_improvement_pct=round(avg_improvement, 1),
            time_saved_hours=time_saved_hours,
            estimated_roi_multiplier=round(roi, 2)
        )
