from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from federation.registry import peer_registry, fed_aggregator, round_manager

app = FastAPI(title="Sovereign Code Federation Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.post("/peers/register")
async def register_peer(peer: PeerInfo):
    peer_registry.register(peer.dict())
    return {"status": "ok", "peer_id": peer.peer_id}


@app.get("/peers")
async def list_peers():
    return peer_registry.list()


@app.delete("/peers/{peer_id}")
async def remove_peer(peer_id: str):
    removed = peer_registry.remove(peer_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Peer not found")
    return {"status": "ok"}


@app.post("/rounds/start")
async def start_round():
    round_obj = round_manager.start_round(peer_registry.list())
    return round_obj


@app.post("/rounds/submit")
async def submit_gradients(update: GradientUpdate):
    result = round_manager.submit_update(update.dict())
    if not result:
        raise HTTPException(status_code=404, detail="Round not found or closed")
    return result


@app.get("/rounds/current")
async def get_current_round():
    r = round_manager.get_current_round()
    if not r:
        raise HTTPException(status_code=404, detail="No active round")
    return r


@app.get("/rounds/history")
async def get_rounds_history():
    return round_manager.history()


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0", "peers": peer_registry.count()}
