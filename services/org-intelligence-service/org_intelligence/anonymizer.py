import re


class AnonymizationEngine:
    """Strip PII, author info, and project-specific identifiers from patterns."""

    # Patterns to redact
    EMAIL_RE = re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b')
    URL_RE = re.compile(r'https?://\S+')
    # Quoted strings that could be secrets/tokens (match rest of line)
    SECRET_RE = re.compile(r'(?:api[_-]?key|token|secret|password|passwd|pwd)\s*[=:]\s*[^\n]+', re.IGNORECASE)
    # Author-like comments: "Author:", "Written by:", "@author"
    AUTHOR_RE = re.compile(r'(?:Author|Written by|@author)[:\s]+\S+.*', re.IGNORECASE)
    # Company/project names in comments (heuristic: capitalized words in # comments)
    COMPANY_RE = re.compile(r'#.*\b[A-Z][a-zA-Z]{3,}(?:Corp|Inc|Ltd|LLC|Co)\b.*')

    def anonymize(self, text: str) -> str:
        text = self.EMAIL_RE.sub('[EMAIL]', text)
        text = self.URL_RE.sub('[URL]', text)
        text = self.SECRET_RE.sub('[REDACTED]', text)
        text = self.AUTHOR_RE.sub('[AUTHOR REDACTED]', text)
        text = self.COMPANY_RE.sub('# [COMPANY COMMENT REDACTED]', text)
        return text
