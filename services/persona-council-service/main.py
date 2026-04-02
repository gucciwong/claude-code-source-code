from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from persona_council.models import ReviewRequest, CouncilReport
from persona_council.council import CouncilOrchestrator, PERSONAS

app = FastAPI(title="Persona Council Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = CouncilOrchestrator()


@app.post("/review", response_model=CouncilReport)
async def review_code(req: ReviewRequest) -> CouncilReport:
    return orchestrator.review(req)


@app.get("/personas")
async def list_personas():
    return [
        {
            "name": p.NAME,
            "description": p.DESCRIPTION,
        }
        for p in PERSONAS
    ]


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
