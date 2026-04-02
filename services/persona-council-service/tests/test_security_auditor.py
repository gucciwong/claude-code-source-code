import pytest
from persona_council.personas import SecurityAuditor
from persona_council.models import Severity


@pytest.fixture
def auditor():
    return SecurityAuditor()


def test_detects_eval(auditor):
    code = "result = eval(user_input)"
    review = auditor.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("eval" in t for t in titles)
    assert any(c.severity == Severity.CRITICAL for c in review.critiques)


def test_detects_hardcoded_password(auditor):
    code = 'password = "supersecret123"'
    review = auditor.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("Password" in t for t in titles)
    assert any(c.severity == Severity.ERROR for c in review.critiques)


def test_detects_os_system(auditor):
    code = "os.system('rm -rf /')"
    review = auditor.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("os.system" in t for t in titles)
    assert any(c.severity == Severity.CRITICAL for c in review.critiques)


def test_detects_md5(auditor):
    code = "import hashlib\nhash = hashlib.md5(data)"
    review = auditor.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("MD5" in t for t in titles)
    assert any(c.severity == Severity.WARNING for c in review.critiques)


def test_detects_http_url(auditor):
    code = 'url = "http://example.com/api"'
    review = auditor.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("HTTP" in t for t in titles)
    assert any(c.severity == Severity.WARNING for c in review.critiques)


def test_detects_pickle_loads(auditor):
    code = "import pickle\ndata = pickle.loads(raw_bytes)"
    review = auditor.review(code, "python")
    titles = [c.title for c in review.critiques]
    assert any("pickle" in t.lower() for t in titles)
    assert any(c.severity == Severity.ERROR for c in review.critiques)


def test_clean_code_returns_no_critiques(auditor):
    code = "def add(a, b):\n    return a + b\n"
    review = auditor.review(code, "python")
    assert review.critiques == []
    assert review.risk_score == 0.0


def test_risk_score_proportional(auditor):
    # Code with critical issue should have higher risk than clean code
    critical_code = "eval(user_input)\npassword = 'secret'\nos.system('cmd')"
    clean_code = "def add(a, b):\n    return a + b"
    critical_review = auditor.review(critical_code, "python")
    clean_review = auditor.review(clean_code, "python")
    assert critical_review.risk_score > clean_review.risk_score
