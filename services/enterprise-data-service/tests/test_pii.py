"""15 tests for PiiMasker."""
from __future__ import annotations

import pytest

from enterprise_data.pii_masker import PiiMasker


@pytest.fixture()
def masker() -> PiiMasker:
    return PiiMasker()


# ---------------------------------------------------------------------------
# Single-type masking
# ---------------------------------------------------------------------------


def test_mask_email_address(masker: PiiMasker) -> None:
    result = masker.mask("contact john@example.com")
    assert result.text == "contact [EMAIL]"


def test_mask_phone_number(masker: PiiMasker) -> None:
    result = masker.mask("call 555-867-5309")
    assert result.text == "call [PHONE]"


def test_mask_ssn(masker: PiiMasker) -> None:
    result = masker.mask("ssn is 123-45-6789")
    assert result.text == "ssn is [SSN]"


def test_mask_credit_card(masker: PiiMasker) -> None:
    result = masker.mask("card: 4111 1111 1111 1111")
    assert result.text == "card: [CARD]"


def test_mask_ip_address(masker: PiiMasker) -> None:
    result = masker.mask("ip 192.168.1.1")
    assert result.text == "ip [IP]"


def test_mask_person_name(masker: PiiMasker) -> None:
    result = masker.mask("contact John Smith")
    assert result.text == "contact [NAME]"


# ---------------------------------------------------------------------------
# Multi-type masking
# ---------------------------------------------------------------------------


def test_mask_multiple_types(masker: PiiMasker) -> None:
    text = "email me at bob@test.org or call 800-555-1234"
    result = masker.mask(text)
    assert "[EMAIL]" in result.text
    assert "[PHONE]" in result.text
    assert "bob@test.org" not in result.text
    assert "800-555-1234" not in result.text


def test_mask_no_pii(masker: PiiMasker) -> None:
    text = "this is a clean string with no pii"
    result = masker.mask(text)
    assert result.text == text
    assert result.entities_masked == 0
    assert result.entity_types == []


# ---------------------------------------------------------------------------
# Count / metadata
# ---------------------------------------------------------------------------


def test_mask_result_entity_count(masker: PiiMasker) -> None:
    text = "email: alice@corp.io phone: 212-555-0100"
    result = masker.mask(text)
    assert result.entities_masked == 2
    assert "EMAIL_ADDRESS" in result.entity_types
    assert "PHONE_NUMBER" in result.entity_types


# ---------------------------------------------------------------------------
# mask_record
# ---------------------------------------------------------------------------


def test_mask_record_masks_string_values(masker: PiiMasker) -> None:
    record = {"contact": "reach me at dev@example.com", "name": "Alice"}
    masked, total = masker.mask_record(record)
    assert "[EMAIL]" in masked["contact"]
    assert "dev@example.com" not in masked["contact"]
    assert total >= 1


def test_mask_record_preserves_non_strings(masker: PiiMasker) -> None:
    record = {"age": 42, "score": 3.14, "active": None, "label": "safe"}
    masked, total = masker.mask_record(record)
    assert masked["age"] == 42
    assert masked["score"] == 3.14
    assert masked["active"] is None
    assert masked["label"] == "safe"
    assert total == 0


# ---------------------------------------------------------------------------
# mask_rows
# ---------------------------------------------------------------------------


def test_mask_rows(masker: PiiMasker) -> None:
    rows = [
        {"email": "a@b.com", "value": 1},
        {"email": "c@d.com", "value": 2},
    ]
    masked_rows, total = masker.mask_rows(rows)
    assert len(masked_rows) == 2
    assert masked_rows[0]["email"] == "[EMAIL]"
    assert masked_rows[1]["email"] == "[EMAIL]"
    assert masked_rows[0]["value"] == 1
    assert masked_rows[1]["value"] == 2


def test_mask_rows_total_count(masker: PiiMasker) -> None:
    rows = [
        {"field": "email: x@y.com call 555-100-2000"},
        {"field": "John Smith lives at 10.0.0.1"},
    ]
    _, total = masker.mask_rows(rows)
    # row 0: EMAIL + PHONE = 2; row 1: PERSON + IP = 2 → total 4
    assert total == 4


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


def test_mask_empty_string(masker: PiiMasker) -> None:
    result = masker.mask("")
    assert result.text == ""
    assert result.entities_masked == 0
    assert result.entity_types == []


def test_mask_empty_list(masker: PiiMasker) -> None:
    masked_rows, total = masker.mask_rows([])
    assert masked_rows == []
    assert total == 0
