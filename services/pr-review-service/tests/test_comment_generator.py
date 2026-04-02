import pytest
from review.comment_generator import CommentGenerator
from review.models import ParsedDiff, FileDiff, Violation


@pytest.fixture
def generator():
    return CommentGenerator()


def make_empty_parsed() -> ParsedDiff:
    return ParsedDiff(files=[], total_additions=0, total_deletions=0)


def make_parsed_with_one_file() -> ParsedDiff:
    return ParsedDiff(
        files=[FileDiff(file_path="a.py", additions=5, deletions=2)],
        total_additions=5,
        total_deletions=2,
    )


def make_violation(severity: str, rule: str = "some_rule") -> Violation:
    return Violation(
        file_path="a.py",
        line=10,
        severity=severity,
        rule=rule,
        message="Test message",
    )


def test_generate_approved_when_no_violations(generator):
    result = generator.generate(make_empty_parsed(), [])
    assert result["approved"] is True


def test_generate_not_approved_when_error_violations(generator):
    violations = [make_violation("error")]
    result = generator.generate(make_parsed_with_one_file(), violations)
    assert result["approved"] is False


def test_generate_score_starts_at_100_decreases_with_violations(generator):
    # 1 warning → 100 - 5 = 95
    violations = [make_violation("warning")]
    result = generator.generate(make_parsed_with_one_file(), violations)
    assert result["summary"]["score"] == 95.0


def test_generate_score_is_zero_with_many_errors(generator):
    # 10 errors → 100 - 200 → clamped to 0
    violations = [make_violation("error") for _ in range(10)]
    result = generator.generate(make_parsed_with_one_file(), violations)
    assert result["summary"]["score"] == 0.0


def test_generate_comments_list_matches_violations(generator):
    violations = [
        make_violation("error", "no_hardcoded_secrets"),
        make_violation("warning", "no_print_statements"),
    ]
    result = generator.generate(make_parsed_with_one_file(), violations)
    assert len(result["comments"]) == 2
    comment_rules = {c["rule"] for c in result["comments"]}
    assert "no_hardcoded_secrets" in comment_rules
    assert "no_print_statements" in comment_rules


def test_generate_summary_has_correct_counts(generator):
    violations = [
        make_violation("error"),
        make_violation("error"),
        make_violation("warning"),
        make_violation("info"),
        make_violation("info"),
        make_violation("info"),
    ]
    result = generator.generate(make_parsed_with_one_file(), violations)
    summary = result["summary"]
    assert summary["errors"] == 2
    assert summary["warnings"] == 1
    assert summary["infos"] == 3
