import re
from typing import List
from .models import FileDiff, ParsedDiff


class GitDiffParser:
    def parse(self, diff_text: str) -> ParsedDiff:
        if not diff_text.strip():
            return ParsedDiff(files=[], total_additions=0, total_deletions=0)

        files: List[FileDiff] = []
        current_file: dict = {}
        current_hunks: List[str] = []
        current_hunk_lines: List[str] = []

        for line in diff_text.splitlines():
            if line.startswith("diff --git"):
                if current_file:
                    if current_hunk_lines:
                        current_hunks.append("\n".join(current_hunk_lines))
                    current_file["hunks"] = current_hunks
                    files.append(FileDiff(**current_file))
                current_file = {
                    "file_path": "",
                    "additions": 0,
                    "deletions": 0,
                    "hunks": [],
                    "is_new_file": False,
                    "is_deleted": False,
                }
                current_hunks = []
                current_hunk_lines = []
                m = re.search(r"b/(.+)$", line)
                if m:
                    current_file["file_path"] = m.group(1)
            elif line.startswith("+++ b/"):
                if current_file:
                    current_file["file_path"] = line[6:]
            elif line.startswith("new file"):
                if current_file:
                    current_file["is_new_file"] = True
            elif line.startswith("deleted file"):
                if current_file:
                    current_file["is_deleted"] = True
            elif line.startswith("@@"):
                if current_hunk_lines:
                    current_hunks.append("\n".join(current_hunk_lines))
                current_hunk_lines = [line]
            elif line.startswith("+") and not line.startswith("+++"):
                if current_file:
                    current_file["additions"] = current_file.get("additions", 0) + 1
                current_hunk_lines.append(line)
            elif line.startswith("-") and not line.startswith("---"):
                if current_file:
                    current_file["deletions"] = current_file.get("deletions", 0) + 1
                current_hunk_lines.append(line)
            else:
                current_hunk_lines.append(line)

        if current_file:
            if current_hunk_lines:
                current_hunks.append("\n".join(current_hunk_lines))
            current_file["hunks"] = current_hunks
            files.append(FileDiff(**current_file))

        total_add = sum(f.additions for f in files)
        total_del = sum(f.deletions for f in files)
        return ParsedDiff(files=files, total_additions=total_add, total_deletions=total_del)
