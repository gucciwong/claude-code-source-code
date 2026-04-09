import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from federation.registry import peer_registry, fed_aggregator, round_manager

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
app = FastAPI(title="Sovereign Code Federation Service", version="0.1.0")

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


class PeerInfo(BaseModel):
    peer_id: str
    address: str
    data_size: int = 100


class GradientUpdate(BaseModel):
    peer_id: str
    round_id: str
    gradients: List[float]
    data_size: int


class RoundResult(BaseModel):
    round_id: str
    aggregated_gradients: List[float]
    participating_peers: int
    dp_noise_applied: bool


@limiter.limit("60/minute")
@app.post("/peers/register")
async def register_peer(request: Request, peer: PeerInfo):
    peer_registry.register(peer.model_dump())
    return {"status": "ok", "peer_id": peer.peer_id}


@limiter.limit("60/minute")
@app.get("/peers")
async def list_peers(request: Request):
    return peer_registry.list()


@limiter.limit("60/minute")
@app.delete("/peers/{peer_id}")
async def remove_peer(request: Request, peer_id: str):
    removed = peer_registry.remove(peer_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Peer not found")
    return {"status": "ok"}


@limiter.limit("60/minute")
@app.post("/rounds/start")
async def start_round(request: Request):
    round_obj = round_manager.start_round(peer_registry.list())
    return round_obj


@limiter.limit("60/minute")
@app.post("/rounds/submit")
async def submit_gradients(request: Request, update: GradientUpdate):
    result = round_manager.submit_update(update.model_dump())
    if not result:
        raise HTTPException(status_code=404, detail="Round not found or closed")
    return result


@limiter.limit("60/minute")
@app.get("/rounds/current")
async def get_current_round(request: Request):
    r = round_manager.get_current_round()
    if not r:
        raise HTTPException(status_code=404, detail="No active round")
    return r


@limiter.limit("60/minute")
@app.get("/rounds/history")
async def get_rounds_history(request: Request):
    return round_manager.history()


@limiter.limit("60/minute")
@app.get("/health")
async def health(request: Request):
    return {"status": "ok", "version": "0.1.0", "peers": peer_registry.count()}
