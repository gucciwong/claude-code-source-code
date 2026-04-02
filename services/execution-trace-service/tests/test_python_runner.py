import sys
import os
import pytest

# Ensure the service root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from execution_trace.python_runner import PythonRunner


@pytest.fixture
def runner():
    return PythonRunner()


def test_run_simple_assignment(runner):
    result = runner.run("x = 42")
    assert any(
        "x" in event.get("vars", {}) for event in result["lines"]
    ), "Expected trace event with var x"
    matching = [e for e in result["lines"] if "x" in e.get("vars", {})]
    assert matching[0]["vars"]["x"] == "42"


def test_run_returns_language_python(runner):
    result = runner.run("x = 1")
    assert result["language"] == "python"


def test_run_no_error_for_valid_code(runner):
    result = runner.run("x = 1\ny = x + 1")
    assert result["error"] is None


def test_run_syntax_error(runner):
    result = runner.run("x = (")
    assert result["error"] is not None
    assert "SyntaxError" in result["error"]


def test_run_runtime_error(runner):
    result = runner.run("x = 1 / 0")
    assert result["error"] is not None
    assert "ZeroDivisionError" in result["error"]


def test_run_timeout(runner):
    result = runner.run("while True: pass", timeout_ms=100)
    assert result["error"] is not None
    assert "exceeded" in result["error"]


def test_run_forbidden_import_os(runner):
    result = runner.run("import os")
    assert result["error"] is not None
    assert "not allowed" in result["error"]


def test_run_forbidden_import_socket(runner):
    result = runner.run("import socket")
    assert result["error"] is not None
    assert "not allowed" in result["error"]


def test_run_duration_ms_positive(runner):
    result = runner.run("x = 1 + 1")
    assert result["duration_ms"] > 0


def test_run_multiple_lines(runner):
    code = "a = 1\nb = 2\nc = 3"
    result = runner.run(code)
    # Multiple trace events expected (one per line that sets a local var)
    assert len(result["lines"]) >= 2


def test_run_empty_vars_not_included(runner):
    # A line with no local vars should not produce a trace event
    result = runner.run("pass")
    # 'pass' has no locals, so trace should be empty
    assert result["lines"] == []


def test_run_function_call(runner):
    code = """
def add(a, b):
    return a + b

result = add(3, 4)
"""
    result = runner.run(code)
    # At least the result assignment should be traced
    assert any("result" in e.get("vars", {}) for e in result["lines"])


def test_run_no_private_vars(runner):
    result = runner.run("_private = 1\nx = 2")
    # _private should not appear in any trace events
    for event in result["lines"]:
        assert "_private" not in event.get("vars", {})


def test_run_returns_dict_with_expected_keys(runner):
    result = runner.run("x = 1")
    assert "lines" in result
    assert "error" in result
    assert "duration_ms" in result
    assert "language" in result


def test_run_loop(runner):
    code = "for i in range(3):\n    x = i"
    result = runner.run(code)
    # Should have trace events containing x
    assert any("x" in e.get("vars", {}) for e in result["lines"])
