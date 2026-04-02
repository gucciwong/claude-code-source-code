import pytest
from org_intelligence.anonymizer import AnonymizationEngine


@pytest.fixture
def engine():
    return AnonymizationEngine()


def test_anonymizes_email(engine):
    result = engine.anonymize("Contact me at john.doe@example.com for help")
    assert "[EMAIL]" in result
    assert "john.doe@example.com" not in result


def test_anonymizes_url(engine):
    result = engine.anonymize("See https://secret-company.internal/api/v1 for details")
    assert "[URL]" in result
    assert "https://" not in result


def test_redacts_api_key(engine):
    result = engine.anonymize("api_key = 'supersecretkey123'")
    assert "[REDACTED]" in result
    assert "supersecretkey123" not in result


def test_redacts_token(engine):
    result = engine.anonymize("token: Bearer abc123token")
    assert "[REDACTED]" in result
    assert "abc123token" not in result


def test_redacts_author_comment(engine):
    result = engine.anonymize("# Author: JohnDoe\ndef my_func(): pass")
    assert "[AUTHOR REDACTED]" in result
    assert "JohnDoe" not in result


def test_passes_through_clean_code(engine):
    code = "def add(a: int, b: int) -> int:\n    return a + b"
    result = engine.anonymize(code)
    assert result == code


def test_multiple_pii_types_in_same_text(engine):
    text = "Author: Alice\napi_key = 'xyz'\ncontact: alice@corp.com\nsee https://corp.com/docs"
    result = engine.anonymize(text)
    assert "[EMAIL]" in result
    assert "[URL]" in result
    assert "[REDACTED]" in result
    assert "[AUTHOR REDACTED]" in result
    assert "Alice" not in result
    assert "xyz" not in result
    assert "alice@corp.com" not in result
