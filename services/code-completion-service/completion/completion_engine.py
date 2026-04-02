from typing import List, Dict, Tuple
from .models import Completion
import re
from collections import defaultdict


class CompletionEngine:
    """N-gram prefix completion engine."""

    def __init__(self):
        # bigram -> {next_word: count}
        self._ngrams: Dict[Tuple[str, ...], Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self._feedback_counts: Dict[str, int] = defaultdict(int)
        # Pre-seed with common code patterns
        self._seed_patterns()

    def _seed_patterns(self):
        """Seed with common programming bigrams."""
        common_sequences = [
            ["def", "function", "return"],
            ["import", "from", "module"],
            ["if", "else", "elif"],
            ["for", "in", "range"],
            ["class", "method", "self"],
            ["const", "let", "var"],
            ["async", "await", "promise"],
            ["try", "catch", "finally"],
            ["return", "value", "result"],
            ["print", "console", "log"],
        ]
        for seq in common_sequences:
            for i in range(len(seq) - 1):
                bigram = (seq[i],)
                self._ngrams[bigram][seq[i + 1]] += 1

    def train(self, text: str) -> None:
        """Train on text corpus."""
        tokens = self._tokenize(text)
        for i in range(len(tokens) - 1):
            bigram = (tokens[i],)
            self._ngrams[bigram][tokens[i + 1]] += 1

    def _tokenize(self, text: str) -> List[str]:
        tokens = re.split(r'\W+', text)
        return [t for t in tokens if t]

    def complete(self, prefix: str, context: str = "", max_results: int = 3) -> List[dict]:
        """Return top completions for given prefix and context."""
        if context:
            self.train(context)

        tokens = self._tokenize(prefix)
        if not tokens:
            return []

        last_token = tokens[-1].lower()
        completions = []

        # Strategy 1: n-gram based on last token
        key = (last_token,)
        if key in self._ngrams:
            total = sum(self._ngrams[key].values())
            for word, count in sorted(self._ngrams[key].items(), key=lambda x: -x[1]):
                if word != last_token:
                    confidence = count / total
                    # Boost by accepted feedback
                    feedback_boost = min(0.1 * self._feedback_counts.get(word, 0), 0.3)
                    completions.append(Completion(
                        text=word,
                        confidence=min(confidence + feedback_boost, 1.0),
                        source="ngram"
                    ))
                if len(completions) >= max_results:
                    break

        # Strategy 2: prefix match in ngram keys
        if len(completions) < max_results:
            for key_tuple, nexts in self._ngrams.items():
                for word in nexts:
                    if word.startswith(last_token) and word != last_token:
                        if not any(c.text == word for c in completions):
                            total = sum(nexts.values())
                            completions.append(Completion(
                                text=word,
                                confidence=nexts[word] / total * 0.5,
                                source="prefix"
                            ))
                    if len(completions) >= max_results:
                        break
                if len(completions) >= max_results:
                    break

        # Sort by confidence descending
        completions.sort(key=lambda c: -c.confidence)
        return [c.model_dump() for c in completions[:max_results]]

    def record_feedback(self, completion: str, accepted: bool) -> None:
        if accepted:
            self._feedback_counts[completion] += 1
        elif completion in self._feedback_counts and self._feedback_counts[completion] > 0:
            self._feedback_counts[completion] -= 1
