from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from completion.registry import completion_engine

app = FastAPI(title="Sovereign Code Completion Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CompletionRequest(BaseModel):
    prefix: str
    context: str = ""
    max_results: int = 3


class CompletionFeedback(BaseModel):
    completion: str
    accepted: bool


@app.post("/complete")
async def complete(req: CompletionRequest):
    results = completion_engine.complete(req.prefix, req.context, req.max_results)
    return {"completions": results}


@app.post("/feedback")
async def feedback(fb: CompletionFeedback):
    completion_engine.record_feedback(fb.completion, fb.accepted)
    return {"status": "ok"}


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
