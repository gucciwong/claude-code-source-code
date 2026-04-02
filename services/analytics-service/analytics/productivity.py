from .models import ProductivityMetrics, EventType
from .collector import MetricsCollector

class ProductivityMetricsCalculator:
    def __init__(self, collector: MetricsCollector):
        self._collector = collector

    def calculate(self) -> ProductivityMetrics:
        all_events = self._collector.get_all_events()

        chat_sessions = [e for e in all_events if e.event_type == EventType.CHAT_SESSION]
        token_events = [e for e in all_events if e.event_type == EventType.TOKEN_USAGE]
        reviews = [e for e in all_events if e.event_type == EventType.CODE_REVIEW]
        training = [e for e in all_events if e.event_type == EventType.TRAINING_RUN]

        total_tokens = sum(e.value for e in token_events)
        total_sessions = len(chat_sessions)
        avg_tokens = total_tokens / total_sessions if total_sessions > 0 else 0.0

        # Acceptance rate: ratio of high-value token events (value > 100) to total
        high_value = [e for e in token_events if e.value > 100]
        acceptance_rate = len(high_value) / len(token_events) if token_events else 0.0

        return ProductivityMetrics(
            total_sessions=total_sessions,
            total_tokens=total_tokens,
            avg_tokens_per_session=round(avg_tokens, 1),
            total_code_reviews=len(reviews),
            total_training_runs=len(training),
            acceptance_rate=round(acceptance_rate, 2)
        )
