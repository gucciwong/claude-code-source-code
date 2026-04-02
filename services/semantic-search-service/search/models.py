from pydantic import BaseModel
from typing import List, Optional, Dict
import numpy as np


class CodeChunk(BaseModel):
    chunk_id: str
    file_path: str
    chunk_text: str
    start_line: int
    end_line: int
    language: str
    metadata: Dict[str, str] = {}

    class Config:
        arbitrary_types_allowed = True
