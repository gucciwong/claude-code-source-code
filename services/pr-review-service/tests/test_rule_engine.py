import pytest
from review.rule_engine import RuleEngine
from review.diff_parser import GitDiffParser
from review.models import ParsedDiff, FileDiff


@pytest.fixture
def engine():
    return RuleEngine()


@pytest.fixture
def parser():
    return GitDiffParser()


def make_parsed_with_hunk(hunk_text: str, file_path: str = "test.py") -> ParsedDiff:
    file_diff = FileDiff(
        file_path=file_path,
        additions=0,
        deletions=0,
        hunks=[hunk_text],
    )
    return ParsedDiff(files=[file_diff], total_additions=0, total_deletions=0)


def test_list_rules_returns_default_rules(engine):
    rules = engine.list_rules()
    assert len(rules) == 4
    ids = [r["id"] for r in rules]
    assert "no_print_statements" in ids
    assert "no_todo_fixme" in ids
    assert "no_hardcoded_secrets" in ids
    assert "large_function" in ids


def test_evaluate_empty_diff_returns_empty(engine):
    empty = ParsedDiff(files=[], total_additions=0, total_deletions=0)
    assert engine.evaluate(empty) == []


def test_evaluate_detects_print_statement(engine):
    hunk = "@@ -1,1 +1,2 @@\n+    print('hello')\n"
    parsed = make_parsed_with_hunk(hunk)
    violations = engine.evaluate(parsed)
    print_violations = [v for v in violations if v.rule == "no_print_statements"]
    assert len(print_violations) >= 1
    assert print_violations[0].severity == "warning"


def test_evaluate_detects_todo_comment(engine):
    hunk = "@@ -1,1 +1,2 @@\n+    # TODO: fix this\n"
    parsed = make_parsed_with_hunk(hunk)
    violations = engine.evaluate(parsed)
    todo_violations = [v for v in violations if v.rule == "no_todo_fixme"]
    assert len(todo_violations) >= 1
    assert todo_violations[0].severity == "info"


def test_evaluate_detects_hardcoded_secret(engine):
    hunk = '@@ -1,1 +1,2 @@\n+    password = "hunter2"\n'
    parsed = make_parsed_with_hunk(hunk)
    violations = engine.evaluate(parsed)
    secret_violations = [v for v in violations if v.rule == "no_hardcoded_secrets"]
    assert len(secret_violations) >= 1
    assert secret_violations[0].severity == "error"


def test_evaluate_filters_to_enabled_rules(engine):
    hunk = '@@ -1,1 +1,3 @@\n+    print("x")\n+    # TODO: fix\n+    password = "s"\n'
    parsed = make_parsed_with_hunk(hunk)
    # Only allow no_print_statements
    violations = engine.evaluate(parsed, enabled_rules=["no_print_statements"])
    rules_triggered = {v.rule for v in violations}
    assert rules_triggered == {"no_print_statements"}


def test_add_custom_rule_adds_to_engine(engine):
    custom = {
        "id": "no_pass",
        "pattern": r"^\+\s*pass\s*$",
        "severity": "info",
        "message": "Empty pass statement.",
    }
    engine.add_custom_rule(custom)
    ids = [r["id"] for r in engine.list_rules()]
    assert "no_pass" in ids


def test_evaluate_case_insensitive_matching(engine):
    # FIXME should match even lowercase (the pattern checks the diff line)
    hunk = "@@ -1,1 +1,2 @@\n+    # fixme: this is broken\n"
    parsed = make_parsed_with_hunk(hunk)
    violations = engine.evaluate(parsed)
    todo_violations = [v for v in violations if v.rule == "no_todo_fixme"]
    assert len(todo_violations) >= 1
