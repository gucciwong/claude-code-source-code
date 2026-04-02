from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class MaskResult:
    text: str
    entities_masked: int
    entity_types: list[str]


# Ordered list of (entity_type, replacement_label, compiled_pattern)
_PATTERN_DEFS: list[tuple[str, str, re.Pattern[str]]] = [
    (
        "EMAIL_ADDRESS",
        "[EMAIL]",
        re.compile(r"\b[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}\b"),
    ),
    (
        "PHONE_NUMBER",
        "[PHONE]",
        re.compile(r"\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b"),
    ),
    (
        "US_SSN",
        "[SSN]",
        re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    ),
    (
        "CREDIT_CARD",
        "[CARD]",
        re.compile(r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b"),
    ),
    (
        "IP_ADDRESS",
        "[IP]",
        re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    ),
    (
        "PERSON",
        "[NAME]",
        re.compile(r"\b[A-Z][a-z]+ [A-Z][a-z]+\b"),
    ),
]


class PiiMasker:
    """
    Pure-Python, regex-based PII masker.

    Applies patterns in the order: EMAIL, PHONE, US_SSN, CREDIT_CARD,
    IP_ADDRESS, PERSON.  Each matched span is replaced with a labelled
    placeholder (e.g. ``[EMAIL]``).
    """

    def mask(self, text: str) -> MaskResult:
        """Apply all PII patterns and return masked text + counts."""
        if not text:
            return MaskResult(text="", entities_masked=0, entity_types=[])

        current = text
        total = 0
        types_found: list[str] = []

        for entity_type, label, pattern in _PATTERN_DEFS:
            current, count = pattern.subn(label, current)
            if count:
                total += count
                types_found.append(entity_type)

        return MaskResult(text=current, entities_masked=total, entity_types=types_found)

    def mask_record(self, record: dict) -> tuple[dict, int]:
        """
        Mask all string values in a dict record.

        Non-string values are passed through unchanged.
        Returns ``(masked_dict, total_entities)``.
        """
        masked: dict = {}
        total = 0
        for key, value in record.items():
            if isinstance(value, str):
                result = self.mask(value)
                masked[key] = result.text
                total += result.entities_masked
            else:
                masked[key] = value
        return masked, total

    def mask_rows(self, rows: list[dict]) -> tuple[list[dict], int]:
        """
        Mask a list of dict records.

        Returns ``(masked_rows, total_entities)`` where *total_entities* is
        the sum across all rows.
        """
        if not rows:
            return [], 0

        masked_rows: list[dict] = []
        grand_total = 0
        for row in rows:
            masked_row, count = self.mask_record(row)
            masked_rows.append(masked_row)
            grand_total += count
        return masked_rows, grand_total
