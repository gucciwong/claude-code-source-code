from .collector import MetricsCollector
from .productivity import ProductivityMetricsCalculator
from .quality_trends import QualityTrendAnalyzer
from .training_roi import TrainingROICalculator
from .exporter import ReportExporter

collector = MetricsCollector()
productivity_calc = ProductivityMetricsCalculator(collector)
quality_analyzer = QualityTrendAnalyzer(collector)
roi_calculator = TrainingROICalculator(collector)
exporter = ReportExporter(collector)
