import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from completion.registry import completion_engine

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# CTG — Conversational Test Generation (Innovation #6)
from completion.test_interviewer import TestInterviewer
app = FastAPI(title="Sovereign Code Completion Service", version="0.1.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:5175,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5175",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)


class CompletionRequest(BaseModel):
    prefix: str
    context: str = ""
    max_results: int = 3


class CompletionFeedback(BaseModel):
    completion: str
    accepted: bool


@limiter.limit("60/minute")
@app.post("/complete")
async def complete(request: Request, req: CompletionRequest):
    results = completion_engine.complete(req.prefix, req.context, req.max_results)
    return {"completions": results}


@limiter.limit("60/minute")
@app.post("/feedback")
async def feedback(request: Request, fb: CompletionFeedback):
    completion_engine.record_feedback(fb.completion, fb.accepted)
    return {"status": "ok"}


@limiter.limit("60/minute")
@app.get("/health")
async def health(request: Request):
    return {"status": "ok", "version": "0.1.0"}


# ──────────────────────────────────────────────────────────────
# CTG — Conversational Test Generation (Innovation #6)
# ──────────────────────────────────────────────────────────────

_test_interviewer = TestInterviewer()


class CTGStartRequest(BaseModel):
    code: str
    language: str = "python"
    function_name: str = ""


class CTGAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer: str
    additional_context: str = ""


class CTGGenerateRequest(BaseModel):
    session_id: str


@limiter.limit("30/minute")
@app.post("/api/v1/ctg/start")
async def ctg_start_interview(request: Request, req: CTGStartRequest):
    """Start a conversational test interview for a piece of code."""
    try:
        session = _test_interviewer.start_interview(
            code=req.code,
            language=req.language,
            function_name=req.function_name,
        )
        return {
            "session_id": session.id,
            "function_name": session.function_name,
            "questions": [
                {
                    "id": q.id,
                    "type": q.question_type.value,
                    "question": q.question,
                    "answer_type": q.answer_type.value,
                    "choices": q.choices,
                    "priority": q.priority,
                }
                for q in session.questions
            ],
            "status": session.status,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("60/minute")
@app.post("/api/v1/ctg/answer")
async def ctg_submit_answer(request: Request, req: CTGAnswerRequest):
    """Submit an answer to an interview question."""
    try:
        session = _test_interviewer.submit_answer(
            session_id=req.session_id,
            question_id=req.question_id,
            answer=req.answer,
            additional_context=req.additional_context,
        )
        return {
            "session_id": session.id,
            "answers_count": len(session.answers),
            "status": session.status,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("30/minute")
@app.post("/api/v1/ctg/generate")
async def ctg_generate_tests(request: Request, req: CTGGenerateRequest):
    """Generate test specifications from interview answers."""
    try:
        test_specs = _test_interviewer.generate_tests(req.session_id)
        return {
            "session_id": req.session_id,
            "test_specs": [
                {
                    "id": spec.id,
                    "name": spec.name,
                    "description": spec.description,
                    "test_type": spec.test_type,
                    "function_name": spec.function_name,
                    "expected_behavior": spec.expected_behavior,
                    "assertions": spec.assertions,
                    "priority": spec.priority,
                }
                for spec in test_specs
            ],
            "total_specs": len(test_specs),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("10/minute")
@app.get("/api/v1/ctg/session/{session_id}")
async def ctg_get_session(request: Request, session_id: str):
    """Get the current state of an interview session."""
    session = _test_interviewer.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return session.to_dict()
