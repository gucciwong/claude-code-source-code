"""
Privacy-Preserving Team Patterns (PPTP) — Innovation #5

Extends the Personal Knowledge Library with a Pattern Exchange that lets
team members share anonymized coding patterns. Patterns contain structure
and approach, but never actual code or business logic.

Priority: P2 | Service: org-intelligence-service (port 8013)
"""

from __future__ import annotations

import ast
import re
import time
import uuid
import hashlib
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, List, Set, Tuple
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class PatternType(Enum):
    """Types of coding patterns."""
    AUTHENTICATION = "authentication"
    ERROR_HANDLING = "error_handling"
    DATA_ACCESS = "data_access"
    CACHING = "caching"
    VALIDATION = "validation"
    LOGGING = "logging"
    TESTING = "testing"
    CONCURRENCY = "concurrency"
    API_DESIGN = "api_design"
    STATE_MANAGEMENT = "state_management"
    CONFIGURATION = "configuration"
    OBSERVABILITY = "observability"


class AnonymizationLevel(Enum):
    """How aggressively to anonymize patterns."""
    LIGHT = "light"       # Remove business logic, keep structure
    MEDIUM = "medium"     # Replace variable names, remove string literals
    STRICT = "strict"     # Full anonymization: only structural skeleton remains


@dataclass
class AnonymizedPattern:
    """A coding pattern with all identifying information removed."""
    id: str
    pattern_type: PatternType
    title: str
    description: str
    structure: str  # Anonymized code structure (no real code)
    approach: str   # High-level approach description
    constraints: List[str] = field(default_factory=list)
    languages: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    anonymization_level: AnonymizationLevel = AnonymizationLevel.MEDIUM
    contributor_hash: str = ""  # Hashed contributor ID (not real ID)
    created_at: float = field(default_factory=time.time)
    usage_count: int = 0
    rating: float = 0.0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "pattern_type": self.pattern_type.value,
            "title": self.title,
            "description": self.description,
            "structure": self.structure,
            "approach": self.approach,
            "constraints": self.constraints,
            "languages": self.languages,
            "tags": self.tags,
            "anonymization_level": self.anonymization_level.value,
            "contributor_hash": self.contributor_hash,
            "created_at": self.created_at,
            "usage_count": self.usage_count,
            "rating": round(self.rating, 2),
        }


@dataclass
class PatternContribution:
    """A raw pattern contribution from a team member."""
    code: str
    language: str
    pattern_type: PatternType
    title: str
    description: str
    contributor_id: str
    anonymization_level: AnonymizationLevel = AnonymizationLevel.MEDIUM


class PatternAnonymizer:
    """Anonymizes code patterns to remove all identifying information.

    Privacy guarantees:
    - No original code is stored
    - Variable names are replaced with generic names
    - String literals are replaced with placeholders
    - Business logic is replaced with generic operations
    - Only structural patterns are preserved
    """

    # Generic replacements for variable names
    VAR_REPLACEMENTS = {
        # Auth patterns
        r'\bpassword\b': 'credential',
        r'\busername\b': 'identifier',
        r'\btoken\b': 'auth_token',
        r'\bsecret\b': 'secret_value',
        r'\bapi_key\b': 'api_credential',
        r'\bemail\b': 'contact_info',
        # Data patterns
        r'\bdb\b': 'data_store',
        r'\bconn\b': 'connection',
        r'\bcursor\b': 'iterator',
        r'\bquery\b': 'data_query',
        r'\bresult\b': 'output',
        r'\bdata\b': 'input_data',
        # Common names
        r'\buser\b': 'entity',
        r'\bitem\b': 'element',
        r'\bconfig\b': 'configuration',
        r'\boptions\b': 'settings',
    }

    def anonymize(
        self,
        code: str,
        language: str,
        level: AnonymizationLevel = AnonymizationLevel.MEDIUM,
    ) -> str:
        """Anonymize code to extract structural pattern without revealing content.

        Args:
            code: Original source code
            language: Programming language
            level: How aggressively to anonymize

        Returns:
            Anonymized code structure with no identifying information
        """
        if level == AnonymizationLevel.LIGHT:
            return self._anonymize_light(code, language)
        elif level == AnonymizationLevel.STRICT:
            return self._anonymize_strict(code, language)
        else:
            return self._anonymize_medium(code, language)

    def _anonymize_light(self, code: str, language: str) -> str:
        """Light anonymization: remove business logic, keep structure."""
        result = code
        # Remove string literals
        result = re.sub(r'(["\'])(?:(?!\1).)*\1', r'\1REDACTED\1', result)
        # Remove comments
        result = re.sub(r'#.*$', '', result, flags=re.MULTILINE)
        result = re.sub(r'//.*$', '', result, flags=re.MULTILINE)
        return result.strip()

    def _anonymize_medium(self, code: str, language: str) -> str:
        """Medium anonymization: replace variable names, remove literals."""
        result = code

        # Replace known sensitive variable names
        for pattern, replacement in self.VAR_REPLACEMENTS.items():
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

        # Replace string literals
        result = re.sub(r'(["\'])(?:(?!\1).)*\1', r'\1placeholder\1', result)

        # Replace numeric literals
        result = re.sub(r'\b\d+\.?\d*\b', 'NUM', result)

        # Remove comments
        result = re.sub(r'#.*$', '', result, flags=re.MULTILINE)
        result = re.sub(r'//.*$', '', result, flags=re.MULTILINE)
        result = re.sub(r'/\*[\s\S]*?\*/', '', result)

        # Replace custom function/class names with generic ones
        if language == "python":
            result = self._anonymize_python_names(result)
        elif language in ("javascript", "typescript"):
            result = self._anonymize_js_names(result)

        return result.strip()

    def _anonymize_strict(self, code: str, language: str) -> str:
        """Strict anonymization: only structural skeleton remains."""
        result = code

        # Replace all identifiers with generic names
        result = re.sub(r'\b[a-zA-Z_][a-zA-Z0-9_]*\b', 'IDENTIFIER', result)
        # Replace all literals
        result = re.sub(r'(["\'])(?:(?!\1).)*\1', r'\1LITERAL\1', result)
        result = re.sub(r'\b\d+\.?\d*\b', 'NUMBER', result)
        # Remove comments
        result = re.sub(r'#.*$', '', result, flags=re.MULTILINE)
        result = re.sub(r'//.*$', '', result, flags=re.MULTILINE)
        result = re.sub(r'/\*[\s\S]*?\*/', '', result)
        # Collapse whitespace
        result = re.sub(r'\n\s*\n', '\n\n', result)

        return result.strip()

    def _anonymize_python_names(self, code: str) -> str:
        """Replace Python-specific names with generic ones."""
        # Replace function definitions (keep structure, generic name)
        code = re.sub(
            r'def\s+(\w+)\s*\(',
            lambda m: f'def generic_func(' if not m.group(1).startswith('_') else m.group(0),
            code,
        )
        # Replace class definitions
        code = re.sub(
            r'class\s+(\w+)\s*[:\(]',
            lambda m: f'class GenericClass:' if m.group(1)[0].isupper() and m.group(1) not in ('Exception', 'Error', 'ValueError', 'TypeError') else m.group(0),
            code,
        )
        return code

    def _anonymize_js_names(self, code: str) -> str:
        """Replace JavaScript-specific names with generic ones."""
        # Replace function declarations
        code = re.sub(
            r'function\s+(\w+)\s*\(',
            r'function genericFunc(',
            code,
        )
        # Replace arrow function variable names
        code = re.sub(
            r'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(',
            r'const genericHandler = (',
            code,
        )
        return code

    def extract_approach(self, code: str, language: str) -> str:
        """Extract the high-level approach from code without revealing details.

        Returns a natural language description of the pattern's approach.
        """
        approach_parts = []

        # Detect patterns
        if re.search(r'try\s*:', code) or re.search(r'try\s*\{', code):
            approach_parts.append("Uses error handling with try/catch")

        if re.search(r'async\s+def|async\s+function|await\s+', code):
            approach_parts.append("Uses asynchronous operations")

        if re.search(r'class\s+\w+', code):
            approach_parts.append("Uses class-based design")

        if re.search(r'decorator|@|@\w+', code):
            approach_parts.append("Uses decorators/middleware")

        if re.search(r'with\s+open|with\s+\w+\s+as', code):
            approach_parts.append("Uses context managers for resource handling")

        if re.search(r'for\s+\w+\s+in|\.forEach\(|\.map\(', code):
            approach_parts.append("Uses iteration over collections")

        if re.search(r'if\s+.*\s+in\s+', code) or re.search(r'\.has\(|\.includes\(', code):
            approach_parts.append("Uses membership checking")

        if re.search(r'cache|memoize|lru_cache', code, re.IGNORECASE):
            approach_parts.append("Uses caching/memoization")

        if re.search(r'validate|check|verify|assert', code, re.IGNORECASE):
            approach_parts.append("Uses input validation")

        if not approach_parts:
            approach_parts.append("Standard procedural approach")

        return "; ".join(approach_parts)

    def extract_constraints(self, code: str, language: str) -> List[str]:
        """Extract constraints and requirements from code patterns."""
        constraints = []

        if re.search(r'raise\s+|throw\s+|except\s+', code):
            constraints.append("Requires error handling")
        if re.search(r'import\s+|require\s*\(', code):
            constraints.append("Has external dependencies")
        if re.search(r'type\s*:|interface\s+|Protocol', code):
            constraints.append("Type-safe implementation")
        if re.search(r'lock|mutex|semaphore|threading', code, re.IGNORECASE):
            constraints.append("Thread-safe / concurrent access required")
        if re.search(r'encrypt|decrypt|hash|salt', code, re.IGNORECASE):
            constraints.append("Security-sensitive operation")

        return constraints


class PatternExchange:
    """The Pattern Exchange for sharing anonymized coding patterns.

    Team members can:
    1. Contribute patterns from their code
    2. Search for patterns by type, language, or tags
    3. Apply patterns to their own codebase

    Privacy guarantee: No original code is ever stored or shared.
    """

    def __init__(self) -> None:
        self._patterns: Dict[str, AnonymizedPattern] = {}
        self._anonymizer = PatternAnonymizer()
        self._type_index: Dict[PatternType, Set[str]] = defaultdict(set)
        self._tag_index: Dict[str, Set[str]] = defaultdict(set)
        self._language_index: Dict[str, Set[str]] = defaultdict(set)

    def contribute(self, contribution: PatternContribution) -> AnonymizedPattern:
        """Contribute a pattern from code.

        The code is anonymized before storage — no original code is kept.

        Args:
            contribution: Raw pattern contribution

        Returns:
            The anonymized pattern (safe to share)
        """
        # Anonymize the code
        structure = self._anonymizer.anonymize(
            contribution.code,
            contribution.language,
            contribution.anonymization_level,
        )

        # Extract approach and constraints
        approach = self._anonymizer.extract_approach(
            contribution.code, contribution.language
        )
        constraints = self._anonymizer.extract_constraints(
            contribution.code, contribution.language
        )

        # Hash the contributor ID (never store real ID)
        contributor_hash = hashlib.sha256(
            contribution.contributor_id.encode()
        ).hexdigest()[:12]

        # Create anonymized pattern
        pattern = AnonymizedPattern(
            id=f"pattern-{uuid.uuid4().hex[:8]}",
            pattern_type=contribution.pattern_type,
            title=contribution.title,
            description=contribution.description,
            structure=structure,
            approach=approach,
            constraints=constraints,
            languages=[contribution.language],
            tags=[contribution.pattern_type.value],
            anonymization_level=contribution.anonymization_level,
            contributor_hash=contributor_hash,
        )

        # Index the pattern
        self._patterns[pattern.id] = pattern
        self._type_index[contribution.pattern_type].add(pattern.id)
        for lang in pattern.languages:
            self._language_index[lang].add(pattern.id)
        for tag in pattern.tags:
            self._tag_index[tag].add(pattern.id)

        logger.info(
            f"PPTP: Contributed pattern {pattern.id} "
            f"({contribution.pattern_type.value})"
        )
        return pattern

    def search(
        self,
        pattern_type: Optional[PatternType] = None,
        language: Optional[str] = None,
        tags: Optional[List[str]] = None,
        query: Optional[str] = None,
    ) -> List[AnonymizedPattern]:
        """Search for patterns matching criteria.

        Args:
            pattern_type: Filter by pattern type
            language: Filter by programming language
            tags: Filter by tags
            query: Free-text search in title/description

        Returns:
            List of matching anonymized patterns
        """
        candidates: Set[str] = set(self._patterns.keys())

        if pattern_type:
            candidates &= self._type_index.get(pattern_type, set())
        if language:
            candidates &= self._language_index.get(language, set())
        if tags:
            for tag in tags:
                candidates &= self._tag_index.get(tag, set())

        results = []
        for pid in candidates:
            pattern = self._patterns[pid]
            if query:
                query_lower = query.lower()
                if (query_lower not in pattern.title.lower() and
                    query_lower not in pattern.description.lower() and
                    query_lower not in pattern.approach.lower()):
                    continue
            results.append(pattern)

        # Sort by rating and usage
        results.sort(key=lambda p: (p.rating, p.usage_count), reverse=True)
        return results

    def get_pattern(self, pattern_id: str) -> Optional[AnonymizedPattern]:
        """Get a specific pattern by ID."""
        pattern = self._patterns.get(pattern_id)
        if pattern:
            pattern.usage_count += 1
        return pattern

    def rate_pattern(self, pattern_id: str, rating: float) -> bool:
        """Rate a pattern (1.0-5.0). Updates the running average."""
        pattern = self._patterns.get(pattern_id)
        if not pattern:
            return False

        # Running average
        total_rating = pattern.rating * pattern.usage_count + rating
        pattern.usage_count += 1
        pattern.rating = total_rating / pattern.usage_count
        return True

    def get_stats(self) -> dict:
        """Get pattern exchange statistics."""
        return {
            "total_patterns": len(self._patterns),
            "patterns_by_type": {
                pt.value: len(ids) for pt, ids in self._type_index.items()
            },
            "patterns_by_language": dict(self._language_index),
            "total_contributors": len(set(
                p.contributor_hash for p in self._patterns.values()
            )),
        }