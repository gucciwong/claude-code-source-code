from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from review.registry import diff_parser, rule_engine, comment_generator

app = FastAPI(title="Sovereign Code PR Review", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReviewRequest(BaseModel):
    diff: str
    language: str = "python"
    rules: List[str] = []  # empty = use all rules


class ReviewComment(BaseModel):
    file_path: str
    line: int
    severity: str  # "error" | "warning" | "info"
    rule: str
    message: str


class ReviewSummary(BaseModel):
    total_files: int
    total_changes: int
    errors: int
    warnings: int
    infos: int
    score: float  # 0-100 quality score


class ReviewResult(BaseModel):
    summary: ReviewSummary
    comments: List[ReviewComment]
    approved: bool


@app.post("/review", response_model=ReviewResult)
async def review_diff(req: ReviewRequest):
    parsed = diff_parser.parse(req.diff)
    violations = rule_engine.evaluate(parsed, req.rules)
    result = comment_generator.generate(parsed, violations)
    return result


@app.get("/rules")
async def list_rules():
    return {"rules": rule_engine.list_rules()}


@app.post("/rules")
async def add_rule(rule: dict):
    rule_engine.add_custom_rule(rule)
    return {"status": "ok"}


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
