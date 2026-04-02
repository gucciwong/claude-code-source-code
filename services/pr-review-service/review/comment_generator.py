from typing import List
from .models import ParsedDiff, Violation


class CommentGenerator:
    def generate(self, parsed: ParsedDiff, violations: List[Violation]) -> dict:
        errors = [v for v in violations if v.severity == "error"]
        warnings = [v for v in violations if v.severity == "warning"]
        infos = [v for v in violations if v.severity == "info"]

        total_changes = parsed.total_additions + parsed.total_deletions
        # Quality score: start at 100, deduct for violations
        score = max(0.0, 100.0 - len(errors) * 20 - len(warnings) * 5 - len(infos) * 1)

        approved = len(errors) == 0 and score >= 70

        summary = {
            "total_files": len(parsed.files),
            "total_changes": total_changes,
            "errors": len(errors),
            "warnings": len(warnings),
            "infos": len(infos),
            "score": round(score, 1),
        }

        comments = [
            {
                "file_path": v.file_path,
                "line": v.line,
                "severity": v.severity,
                "rule": v.rule,
                "message": v.message,
            }
            for v in violations
        ]

        return {"summary": summary, "comments": comments, "approved": approved}
