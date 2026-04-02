from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time

from messaging.registry import platform_registry, command_processor

app = FastAPI(title="Sovereign Code Messaging Bridge", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.post("/platforms/configure")
async def configure_platform(config: PlatformConfigRequest):
    platform_registry.configure(config.model_dump())
    return {"status": "ok", "platform": config.platform}


@app.get("/platforms")
async def list_platforms():
    return platform_registry.list()


@app.delete("/platforms/{platform_name}")
async def remove_platform(platform_name: str):
    removed = platform_registry.remove(platform_name)
    if not removed:
        raise HTTPException(status_code=404, detail=f"Platform '{platform_name}' not configured")
    return {"status": "ok", "removed": platform_name}


@app.post("/webhooks/{platform}")
async def receive_webhook(platform: str, payload: WebhookPayload):
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


@app.get("/messages/log")
async def get_message_log():
    return command_processor.get_log()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "0.1.0",
        "platforms_configured": len(platform_registry.list()),
    }
