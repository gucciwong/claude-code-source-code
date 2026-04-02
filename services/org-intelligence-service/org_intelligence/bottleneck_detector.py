import re
from typing import List
from .models import Bottleneck, SharedPattern


class BottleneckDetector:
    """Identify areas referenced frequently by patterns with low quality signals."""

    AREA_PATTERNS = {
        "database_access": r'\b(?:query|SELECT|INSERT|UPDATE|DELETE|db\.|conn\.|cursor)\b',
        "error_handling": r'\b(?:try|except|raise|catch|throw)\b',
        "authentication": r'\b(?:login|logout|auth|token|jwt|session|password)\b',
        "file_io": r'\b(?:open\(|read\(|write\(|file|path|os\.path|shutil)\b',
        "network": r'\b(?:requests\.|fetch|http|url|api|endpoint)\b',
    }

    def detect(self, patterns: List[SharedPattern]) -> List[Bottleneck]:
        area_counts = {area: 0 for area in self.AREA_PATTERNS}

        for pattern in patterns:
            for area, regex in self.AREA_PATTERNS.items():
                if re.search(regex, pattern.pattern_text, re.IGNORECASE):
                    area_counts[area] += 1

        bottlenecks = []
        for area, count in area_counts.items():
            if count > 0:
                severity = 'high' if count >= 5 else 'medium' if count >= 2 else 'low'
                bottlenecks.append(Bottleneck(
                    area=area,
                    frequency=count,
                    description=f"{count} pattern(s) reference {area.replace('_', ' ')}",
                    severity=severity
                ))

        return sorted(bottlenecks, key=lambda b: b.frequency, reverse=True)
