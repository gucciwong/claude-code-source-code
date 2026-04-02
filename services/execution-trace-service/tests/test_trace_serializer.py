import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from execution_trace.trace_serializer import TraceSerializer


@pytest.fixture
def serializer():
    return TraceSerializer()


def test_annotated_source_empty_trace(serializer):
    source = "x = 1\ny = 2"
    result = serializer.to_annotated_source(source, [], "python")
    assert result == source


def test_annotated_source_adds_comment_after_line(serializer):
    source = "x = 5"
    trace = [{"line": 1, "vars": {"x": "5"}}]
    result = serializer.to_annotated_source(source, trace, "python")
    assert "# trace:" in result
    assert "x=5" in result


def test_annotated_source_multiple_vars(serializer):
    source = "x = 1\ny = 2\nz = x + y"
    trace = [{"line": 3, "vars": {"x": "1", "y": "2", "z": "3"}}]
    result = serializer.to_annotated_source(source, trace, "python")
    lines = result.split("\n")
    assert "x=1" in lines[2]
    assert "y=2" in lines[2]
    assert "z=3" in lines[2]


def test_annotated_source_call_event(serializer):
    source = "add(1, 2)"
    trace = [{"line": 1, "call": "add", "duration_ms": 1.2}]
    result = serializer.to_annotated_source(source, trace, "python")
    assert "call=add()" in result
    assert "duration=1.2ms" in result


def test_annotated_source_multiline_code(serializer):
    source = "a = 1\nb = 2\nc = 3"
    trace = [{"line": 2, "vars": {"b": "2"}}]
    result = serializer.to_annotated_source(source, trace, "python")
    lines = result.split("\n")
    assert "# trace:" not in lines[0]
    assert "# trace:" in lines[1]
    assert "# trace:" not in lines[2]


def test_annotated_source_out_of_range_line(serializer):
    source = "x = 1"
    trace = [{"line": 999, "vars": {"x": "1"}}]
    # Should not raise, just ignore
    result = serializer.to_annotated_source(source, trace, "python")
    assert result == source


def test_to_xml_context_has_trace_context_tag(serializer):
    result = serializer.to_xml_context("python", "x = 1", [], None)
    assert "<trace_context" in result
    assert "</trace_context>" in result


def test_to_xml_context_has_language_attr(serializer):
    result = serializer.to_xml_context("python", "x = 1", [], None)
    assert 'lang="python"' in result


def test_to_xml_context_with_error(serializer):
    result = serializer.to_xml_context("python", "x = 1", [], "ZeroDivisionError: division by zero")
    assert "<error>" in result
    assert "ZeroDivisionError" in result


def test_to_xml_context_no_error(serializer):
    result = serializer.to_xml_context("python", "x = 1", [], None)
    assert "<error>" not in result
