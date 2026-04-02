from typing import List

class ContextExtractor:
    """Extracts prefix context from active file content."""

    def __init__(self, window_lines: int = 10):
        self.window_lines = window_lines

    def extract_context(self, content: str, cursor_line: int = -1) -> str:
        """
        Returns up to window_lines lines before cursor_line.
        If cursor_line == -1, returns last window_lines lines.
        """
        lines = content.splitlines()
        if cursor_line < 0:
            cursor_line = len(lines)
        start = max(0, cursor_line - self.window_lines)
        return "\n".join(lines[start:cursor_line])

    def extract_current_line_prefix(self, content: str, cursor_line: int = -1) -> str:
        """Returns the line at cursor_line (or last line)."""
        lines = content.splitlines()
        if not lines:
            return ""
        if cursor_line < 0 or cursor_line >= len(lines):
            return lines[-1] if lines else ""
        return lines[cursor_line]

    def tokenize_prefix(self, prefix: str) -> List[str]:
        """Splits prefix into tokens by non-alphanumeric boundaries."""
        import re
        tokens = re.split(r'[^a-zA-Z0-9]+', prefix)
        return [t for t in tokens if t]
