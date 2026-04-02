import time
from typing import List
from .models import SkillGap, SkillGapReport, SharedPattern

# Best practice checklist topics
BEST_PRACTICES = {
    "error_handling": ["try", "except", "catch", "error", "exception"],
    "type_annotations": ["type", "interface", "TypedDict", "Protocol", "Generic"],
    "testing": ["test", "assert", "mock", "fixture", "describe", "it(", "expect"],
    "documentation": ["docstring", '"""', "//", "/**", "comment"],
    "async_patterns": ["async", "await", "Promise", "asyncio", "concurrent"],
}


class SkillGapAnalyzer:
    def analyze(self, patterns: List[SharedPattern]) -> SkillGapReport:
        """
        For each best practice topic, compute adoption rate (fraction of patterns
        that mention at least one keyword from that topic).
        Gaps are topics with adoption_rate < 0.5.
        """
        if not patterns:
            return SkillGapReport(gaps=[], generated_at=time.time())

        gaps = []
        for topic, keywords in BEST_PRACTICES.items():
            matching = []
            for p in patterns:
                text_lower = p.pattern_text.lower()
                if any(kw in text_lower for kw in keywords):
                    matching.append(p)
            adoption_rate = len(matching) / len(patterns)
            if adoption_rate < 0.5:
                recommended = [p.pattern_text[:80] for p in matching[:3]]
                gaps.append(SkillGap(
                    topic=topic,
                    adoption_rate=round(adoption_rate, 2),
                    recommended_patterns=recommended
                ))

        return SkillGapReport(gaps=gaps, generated_at=time.time())
