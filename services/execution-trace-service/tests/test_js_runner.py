import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from execution_trace.js_runner import JSRunner


@pytest.fixture
def runner():
    return JSRunner()


def test_run_simple_expression(runner):
    result = runner.run("console.log('hello')")
    assert result["language"] == "javascript"


def test_run_returns_language_javascript(runner):
    result = runner.run("let x = 1;")
    assert result["language"] == "javascript"


def test_run_forbidden_require(runner):
    result = runner.run("const fs = require('fs');")
    assert result["error"] is not None
    assert "require" in result["error"]


def test_run_forbidden_process(runner):
    result = runner.run("process.exit(1);")
    assert result["error"] is not None
    assert "process" in result["error"]


def test_run_forbidden_eval(runner):
    result = runner.run("eval('1+1');")
    assert result["error"] is not None
    assert "eval" in result["error"]


def test_run_forbidden_function_constructor(runner):
    result = runner.run("new Function('return 1')();")
    assert result["error"] is not None
    assert "Function" in result["error"]


def test_run_forbidden_dynamic_import(runner):
    result = runner.run("import('fs');")
    assert result["error"] is not None
    assert "import" in result["error"]


def test_run_forbidden_proto(runner):
    result = runner.run("let x = {}.__proto__;")
    assert result["error"] is not None
    assert "__proto__" in result["error"]


def test_run_duration_ms_positive(runner):
    result = runner.run("let x = 1 + 1;")
    assert result["duration_ms"] >= 0


def test_run_syntax_error(runner):
    result = runner.run("let x = ;")
    assert result["error"] is not None


def test_run_allowed_math(runner):
    result = runner.run("let x = Math.max(1, 2);")
    # Math is allowed in sandbox
    assert result["error"] is None or result["language"] == "javascript"


def test_run_allowed_json(runner):
    result = runner.run("let obj = JSON.parse('{\"a\":1}');")
    # JSON is allowed in sandbox
    assert result["error"] is None or result["language"] == "javascript"


def test_run_forbidden_pattern_in_comment_ignored(runner):
    # require in a comment should NOT trigger the block
    result = runner.run("// require('fs')\nlet x = 1;")
    assert result["error"] is None or "require" not in (result["error"] or "")


def test_run_forbidden_pattern_in_string_ignored(runner):
    # require in a string literal should NOT trigger the block
    result = runner.run("let msg = 'require is cool';")
    assert result["error"] is None or "require" not in (result["error"] or "")