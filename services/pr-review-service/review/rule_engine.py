import re
from typing import List
from .models import FileDiff, ParsedDiff, Violation

DEFAULT_RULES = [
    {
        "id": "no_print_statements",
        "pattern": r"^\+.*\bprint\s*\(",
        "severity": "warning",
        "message": "Avoid print statements in production code; use logging instead.",
    },
    {
        "id": "no_todo_fixme",
        "pattern": r"^\+.*(TODO|FIXME|HACK|XXX)",
        "severity": "info",
        "message": "TODO/FIXME comment should be tracked in an issue.",
    },
    {
        "id": "no_hardcoded_secrets",
        "pattern": r"^\+.*(password|secret|api_key|token)\s*=\s*['\"].+['\"]",
        "severity": "error",
        "message": "Possible hardcoded secret detected.",
    },
    {
        "id": "large_function",
        "pattern": r"^\+.{200,}",
        "severity": "info",
        "message": "Very long line detected (>200 chars); consider refactoring.",
    },
]


class RuleEngine:
    def __init__(self):
        self._rules = list(DEFAULT_RULES)

    def list_rules(self) -> List[dict]:
        return [
            {"id": r["id"], "severity": r["severity"], "message": r["message"]}
            for r in self._rules
        ]

    def add_custom_rule(self, rule: dict) -> None:
        self._rules.append(rule)

    def evaluate(self, parsed: ParsedDiff, enabled_rules: List[str] = []) -> List[Violation]:
        active = (
            self._rules
            if not enabled_rules
            else [r for r in self._rules if r["id"] in enabled_rules]
        )
        violations: List[Violation] = []
        for file_diff in parsed.files:
            line_num = 0
            for hunk in file_diff.hunks:
                for hunk_line in hunk.splitlines():
                    if hunk_line.startswith("@@"):
                        m = re.search(r"\+(\d+)", hunk_line)
                        line_num = int(m.group(1)) if m else 0
                        continue
                    if hunk_line.startswith("+"):
                        line_num += 1
                    elif not hunk_line.startswith("-"):
                        line_num += 1
                    for rule in active:
                        if re.search(rule["pattern"], hunk_line, re.IGNORECASE):
                            violations.append(
                                Violation(
                                    file_path=file_diff.file_path,
                                    line=max(1, line_num),
                                    severity=rule["severity"],
                                    rule=rule["id"],
                                    message=rule["message"],
                                )
                            )
        return violations
