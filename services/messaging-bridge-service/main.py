import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time

from messaging.registry import platform_registry, command_processor

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
app = FastAPI(title="Sovereign Code Messaging Bridge", version="0.1.0")

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


class PlatformConfigRequest(BaseModel):
    platform: str
    bot_token: Optional[str] = None
    webhook_url: Optional[str] = None
    allowed_user_ids: List[str] = []
    enabled: bool = True


class WebhookPayload(BaseModel):
    sender_id: str
    text: str
    platform: str
    metadata: Dict[str, Any] = {}


@limiter.limit("60/minute")
@app.post("/platforms/configure")
async def configure_platform(request: Request, config: PlatformConfigRequest):
    platform_registry.configure(config.model_dump())
    return {"status": "ok", "platform": config.platform}


@limiter.limit("60/minute")
@app.get("/platforms")
async def list_platforms(request: Request):
    return platform_registry.list()


@limiter.limit("60/minute")
@app.delete("/platforms/{platform_name}")
async def remove_platform(request: Request, platform_name: str):
    removed = platform_registry.remove(platform_name)
    if not removed:
        raise HTTPException(status_code=404, detail=f"Platform '{platform_name}' not configured")
    return {"status": "ok", "removed": platform_name}


@limiter.limit("60/minute")
@app.post("/webhooks/{platform}")
async def receive_webhook(request: Request, platform: str, payload: WebhookPayload):
    config = platform_registry.get(platform)
    if not config:
        raise HTTPException(status_code=404, detail=f"Platform '{platform}' not configured")
    if not config.get("enabled", True):
        raise HTTPException(status_code=403, detail="Platform is disabled")
    allowed = config.get("allowed_user_ids", [])
    if allowed and payload.sender_id not in allowed:
        raise HTTPException(status_code=403, detail="Sender not authorized")
    response_text = command_processor.process(
        payload.text, platform=platform, sender_id=payload.sender_id
    )
    return {
        "status": "ok",
        "platform": platform,
        "response": response_text,
        "timestamp": time.time(),
    }


@limiter.limit("60/minute")
@app.get("/messages/log")
async def get_message_log(request: Request):
    return command_processor.get_log()


@limiter.limit("60/minute")
@app.get("/health")
async def health(request: Request):
    return {
        "status": "ok",
        "version": "0.1.0",
        "platforms_configured": len(platform_registry.list()),
    }
