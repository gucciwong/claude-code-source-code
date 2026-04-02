from pydantic import BaseModel

class Completion(BaseModel):
    text: str
    confidence: float
    source: str = "ngram"  # "ngram" | "prefix" | "template"
