from pydantic import BaseModel
from typing import List


class FileDiff(BaseModel):
    file_path: str
    additions: int
    deletions: int
    hunks: List[str] = []
    is_new_file: bool = False
    is_deleted: bool = False


class ParsedDiff(BaseModel):
    files: List[FileDiff]
    total_additions: int
    total_deletions: int


class Violation(BaseModel):
    file_path: str
    line: int
    severity: str
    rule: str
    message: str
