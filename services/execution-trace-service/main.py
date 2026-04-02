from fastapi import FastAPI
from pydantic import BaseModel
import os

app = FastAPI(title="Execution Trace Service", version="0.1.0")

PORT = int(os.getenv("PORT", "8005"))


class TraceRequest(BaseModel):
    code: str
    timeout_ms: int = 5000  # default 5 second timeout


class TraceResponse(BaseModel):
    lines: list[dict]  # list of TraceEvent dicts
    error: str | None = None
    duration_ms: float
    language: str


@app.post("/trace/python", response_model=TraceResponse)
async def trace_python(request: TraceRequest) -> TraceResponse:
    from execution_trace.python_runner import PythonRunner
    runner = PythonRunner()
    return runner.run(request.code, request.timeout_ms)


@app.post("/trace/js", response_model=TraceResponse)
async def trace_js(request: TraceRequest) -> TraceResponse:
    from execution_trace.js_runner import JSRunner
    runner = JSRunner()
    return runner.run(request.code, request.timeout_ms)


@app.get("/health")
async def health():
    import shutil
    return {
        "status": "ok",
        "python_available": True,
        "node_available": shutil.which("node") is not None,
    }
