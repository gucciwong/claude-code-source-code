import uuid
import time
import math
from typing import List, Dict
from collections import Counter
from .models import SharedPattern, ContributeRequest
from .anonymizer import AnonymizationEngine


class PatternAggregator:
    """Store and retrieve patterns; merge similar ones using TF-IDF cosine similarity."""

    SIMILARITY_THRESHOLD = 0.7

    def __init__(self):
        self._patterns: Dict[str, SharedPattern] = {}
        self._anonymizer = AnonymizationEngine()

    def _tokenize(self, text: str) -> List[str]:
        import re
        return re.findall(r'\w+', text.lower())

    def _tf(self, tokens: List[str]) -> Dict[str, float]:
        count = Counter(tokens)
        total = len(tokens) or 1
        return {t: c / total for t, c in count.items()}

    def _idf(self, term: str) -> float:
        n = len(self._patterns) + 1
        count = sum(1 for p in self._patterns.values() if term in self._tokenize(p.pattern_text)) + 1
        return math.log(n / count) + 1  # +1 floor prevents zero vectors when all terms are in corpus

    def _tfidf_vector(self, text: str) -> Dict[str, float]:
        tokens = self._tokenize(text)
        tf_scores = self._tf(tokens)
        return {t: tf_scores[t] * self._idf(t) for t in tf_scores}

    def _cosine_similarity(self, vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
        keys = set(vec_a) & set(vec_b)
        dot = sum(vec_a[k] * vec_b[k] for k in keys)
        mag_a = math.sqrt(sum(v * v for v in vec_a.values()))
        mag_b = math.sqrt(sum(v * v for v in vec_b.values()))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)

    def contribute(self, req: ContributeRequest) -> SharedPattern:
        """Anonymize and store/merge a pattern."""
        anon_text = self._anonymizer.anonymize(req.pattern_text)
        new_vec = self._tfidf_vector(anon_text)

        # Check if similar pattern already exists
        for pid, pattern in self._patterns.items():
            existing_vec = self._tfidf_vector(pattern.pattern_text)
            sim = self._cosine_similarity(new_vec, existing_vec)
            if sim >= self.SIMILARITY_THRESHOLD:
                # Merge: increment contributor count
                pattern.contributor_count += 1
                return pattern

        # New unique pattern
        pattern = SharedPattern(
            id=str(uuid.uuid4()),
            language=req.language,
            pattern_text=anon_text,
            contributor_count=1,
            usage_count=0,
            created_at=time.time()
        )
        self._patterns[pattern.id] = pattern
        return pattern

    def list_patterns(self) -> List[SharedPattern]:
        return list(self._patterns.values())

    def search(self, query: str) -> List[SharedPattern]:
        if not self._patterns:
            return []
        query_vec = self._tfidf_vector(query)
        scored = []
        for pattern in self._patterns.values():
            pv = self._tfidf_vector(pattern.pattern_text)
            sim = self._cosine_similarity(query_vec, pv)
            scored.append((sim, pattern))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [p for _, p in scored if _ > 0]
