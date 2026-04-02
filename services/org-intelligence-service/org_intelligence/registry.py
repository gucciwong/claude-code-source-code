from .pattern_aggregator import PatternAggregator
from .skill_gap_analyzer import SkillGapAnalyzer
from .bottleneck_detector import BottleneckDetector

# Singletons
aggregator = PatternAggregator()
skill_analyzer = SkillGapAnalyzer()
bottleneck_detector = BottleneckDetector()
