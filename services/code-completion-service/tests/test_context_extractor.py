import pytest
from completion.context_extractor import ContextExtractor


@pytest.fixture
def extractor():
    return ContextExtractor(window_lines=10)


def test_extract_context_returns_all_lines_when_content_less_than_window(extractor):
    content = "line1\nline2\nline3"
    result = extractor.extract_context(content, cursor_line=-1)
    assert result == content


def test_extract_context_with_cursor_line_returns_lines_before_cursor(extractor):
    content = "line0\nline1\nline2\nline3\nline4"
    result = extractor.extract_context(content, cursor_line=2)
    assert result == "line0\nline1"


def test_extract_current_line_prefix_returns_last_line_when_cursor_negative(extractor):
    content = "first\nsecond\nthird"
    result = extractor.extract_current_line_prefix(content, cursor_line=-1)
    assert result == "third"


def test_extract_current_line_prefix_returns_correct_line_by_index(extractor):
    content = "line0\nline1\nline2"
    result = extractor.extract_current_line_prefix(content, cursor_line=1)
    assert result == "line1"


def test_tokenize_prefix_splits_on_non_alphanumeric_chars(extractor):
    tokens = extractor.tokenize_prefix("hello.world foo_bar")
    assert "hello" in tokens
    assert "world" in tokens
    assert "foo" in tokens
    assert "bar" in tokens


def test_tokenize_prefix_returns_empty_list_for_empty_string(extractor):
    tokens = extractor.tokenize_prefix("")
    assert tokens == []
