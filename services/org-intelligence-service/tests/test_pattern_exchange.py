"""
Tests for Privacy-Preserving Team Patterns (PPTP) — Innovation #5
"""

import pytest
from org_intelligence.pattern_exchange import (
    PatternExchange,
    PatternAnonymizer,
    PatternContribution,
    AnonymizedPattern,
    PatternType,
    AnonymizationLevel,
)


SAMPLE_AUTH_CODE = '''
def authenticate(username, password):
    """Authenticate a user with username and password."""
    if not username or not password:
        raise ValueError("Missing credentials")
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise AuthenticationError("User not found")
    
    if not verify_password(password, user.password_hash):
        raise AuthenticationError("Invalid password")
    
    token = generate_token(user.id)
    return {"token": token, "user_id": user.id}
'''

SAMPLE_ERROR_HANDLING = '''
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        logger.error('Fetch failed:', error);
        throw new AppError('DATA_FETCH_FAILED', error.message);
    }
}
'''


class TestPatternAnonymizer:
    def setup_method(self):
        self.anonymizer = PatternAnonymizer()

    def test_anonymize_light(self):
        result = self.anonymizer.anonymize(
            'name = "John Doe"', "python", AnonymizationLevel.LIGHT
        )
        assert "John Doe" not in result
        assert "REDACTED" in result

    def test_anonymize_medium(self):
        result = self.anonymizer.anonymize(
            SAMPLE_AUTH_CODE, "python", AnonymizationLevel.MEDIUM
        )
        # Should replace sensitive variable names
        assert "username" not in result or "identifier" in result
        # Should replace string literals
        assert "Missing credentials" not in result

    def test_anonymize_strict(self):
        result = self.anonymizer.anonymize(
            'def hello(name):\n    return f"Hello {name}"',
            "python",
            AnonymizationLevel.STRICT,
        )
        # Strict should replace all identifiers
        assert "IDENTIFIER" in result or "LITERAL" in result

    def test_anonymize_javascript(self):
        result = self.anonymizer.anonymize(
            SAMPLE_ERROR_HANDLING, "javascript", AnonymizationLevel.MEDIUM
        )
        assert isinstance(result, str)
        assert len(result) > 0

    def test_extract_approach(self):
        approach = self.anonymizer.extract_approach(SAMPLE_AUTH_CODE, "python")
        assert "error handling" in approach.lower() or "validation" in approach.lower()

    def test_extract_approach_async(self):
        approach = self.anonymizer.extract_approach(SAMPLE_ERROR_HANDLING, "javascript")
        assert "asynchronous" in approach.lower() or "error handling" in approach.lower()

    def test_extract_constraints(self):
        constraints = self.anonymizer.extract_constraints(SAMPLE_AUTH_CODE, "python")
        assert isinstance(constraints, list)
        # Should detect error handling
        assert any("error" in c.lower() for c in constraints)

    def test_no_original_code_stored(self):
        """Verify that anonymized code doesn't contain original sensitive data."""
        result = self.anonymizer.anonymize(
            'password = "super_secret_123"', "python", AnonymizationLevel.MEDIUM
        )
        assert "super_secret_123" not in result


class TestPatternExchange:
    def setup_method(self):
        self.exchange = PatternExchange()

    def test_contribute_pattern(self):
        contribution = PatternContribution(
            code=SAMPLE_AUTH_CODE,
            language="python",
            pattern_type=PatternType.AUTHENTICATION,
            title="JWT Auth Handler",
            description="Standard JWT authentication pattern",
            contributor_id="user-123",
        )
        pattern = self.exchange.contribute(contribution)
        assert pattern.id.startswith("pattern-")
        assert pattern.pattern_type == PatternType.AUTHENTICATION
        assert pattern.title == "JWT Auth Handler"
        # Original code should NOT be in the structure
        assert "super_secret" not in pattern.structure
        assert "user-123" not in pattern.contributor_hash

    def test_search_by_type(self):
        contribution = PatternContribution(
            code=SAMPLE_AUTH_CODE,
            language="python",
            pattern_type=PatternType.AUTHENTICATION,
            title="Auth Pattern",
            description="Auth pattern",
            contributor_id="user-1",
        )
        self.exchange.contribute(contribution)

        results = self.exchange.search(pattern_type=PatternType.AUTHENTICATION)
        assert len(results) >= 1
        assert results[0].pattern_type == PatternType.AUTHENTICATION

    def test_search_by_language(self):
        contribution = PatternContribution(
            code=SAMPLE_AUTH_CODE,
            language="python",
            pattern_type=PatternType.AUTHENTICATION,
            title="Auth Pattern",
            description="Auth pattern",
            contributor_id="user-1",
        )
        self.exchange.contribute(contribution)

        results = self.exchange.search(language="python")
        assert len(results) >= 1

    def test_search_by_query(self):
        contribution = PatternContribution(
            code=SAMPLE_AUTH_CODE,
            language="python",
            pattern_type=PatternType.AUTHENTICATION,
            title="JWT Authentication Handler",
            description="Standard JWT auth pattern",
            contributor_id="user-1",
        )
        self.exchange.contribute(contribution)

        results = self.exchange.search(query="authentication")
        assert len(results) >= 1

    def test_search_no_results(self):
        results = self.exchange.search(pattern_type=PatternType.CACHING)
        assert len(results) == 0

    def test_get_pattern(self):
        contribution = PatternContribution(
            code=SAMPLE_AUTH_CODE,
            language="python",
            pattern_type=PatternType.AUTHENTICATION,
            title="Auth Pattern",
            description="Auth pattern",
            contributor_id="user-1",
        )
        pattern = self.exchange.contribute(contribution)
        retrieved = self.exchange.get_pattern(pattern.id)
        assert retrieved is not None
        assert retrieved.id == pattern.id

    def test_get_nonexistent_pattern(self):
        result = self.exchange.get_pattern("nonexistent")
        assert result is None

    def test_rate_pattern(self):
        contribution = PatternContribution(
            code=SAMPLE_AUTH_CODE,
            language="python",
            pattern_type=PatternType.AUTHENTICATION,
            title="Auth Pattern",
            description="Auth pattern",
            contributor_id="user-1",
        )
        pattern = self.exchange.contribute(contribution)

        success = self.exchange.rate_pattern(pattern.id, 4.5)
        assert success is True

        updated = self.exchange.get_pattern(pattern.id)
        assert updated.rating > 0

    def test_rate_nonexistent_pattern(self):
        success = self.exchange.rate_pattern("nonexistent", 4.0)
        assert success is False

    def test_get_stats(self):
        contribution = PatternContribution(
            code=SAMPLE_AUTH_CODE,
            language="python",
            pattern_type=PatternType.AUTHENTICATION,
            title="Auth Pattern",
            description="Auth pattern",
            contributor_id="user-1",
        )
        self.exchange.contribute(contribution)

        stats = self.exchange.get_stats()
        assert stats["total_patterns"] >= 1
        assert "authentication" in stats["patterns_by_type"]

    def test_contributor_hash_is_anonymous(self):
        """Contributor ID should be hashed, not stored directly."""
        contribution = PatternContribution(
            code="x = 1",
            language="python",
            pattern_type=PatternType.VALIDATION,
            title="Test",
            description="Test",
            contributor_id="alice@example.com",
        )
        pattern = self.exchange.contribute(contribution)
        assert "alice@example.com" not in pattern.contributor_hash
        assert len(pattern.contributor_hash) == 12

    def test_multiple_contributions(self):
        for i in range(3):
            contribution = PatternContribution(
                code=f"x = {i}",
                language="python",
                pattern_type=PatternType.VALIDATION,
                title=f"Pattern {i}",
                description=f"Test pattern {i}",
                contributor_id=f"user-{i}",
            )
            self.exchange.contribute(contribution)

        stats = self.exchange.get_stats()
        assert stats["total_patterns"] == 3