from pydantic import BaseModel
from typing import List

class PluginManifest(BaseModel):
    id: str
    name: str
    version: str
    description: str
    author: str
    hooks: List[str] = []
    enabled: bool = True

BUILTIN_HOOKS = ["on_startup", "on_chat_message", "on_code_review", "on_training_complete", "on_search_query"]
