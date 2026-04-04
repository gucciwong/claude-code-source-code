from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from orchestration.models import OrchestratorSession
from orchestration.session_manager import SessionManager

app = FastAPI(title="Orchestration Service", version="0.1.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session_manager = SessionManager()


class CreateSessionBody(BaseModel):
    goal: str
    context: str = ""


@app.get("/health")
@limiter.limit("60/minute")
def health(request: Request):
    return {"status": "ok", "version": "0.1.0"}


@app.post("/sessions", response_model=OrchestratorSession)
@limiter.limit("30/minute")
def create_session(request: Request, body: CreateSessionBody):
    session = session_manager.create_session(goal=body.goal, context=body.context)
    return session


@app.get("/sessions/{session_id}", response_model=OrchestratorSession)
@limiter.limit("30/minute")
def get_session(request: Request, session_id: str):
    session = session_manager.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.delete("/sessions/{session_id}")
@limiter.limit("30/minute")
def cancel_session(request: Request, session_id: str):
    cancelled = session_manager.cancel_session(session_id)
    if not cancelled:
        raise HTTPException(status_code=404, detail="Session not found or already finished")
    return {"cancelled": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
