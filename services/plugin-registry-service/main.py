import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from registry.registry import plugin_registry, hook_dispatcher

from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
app = FastAPI(title="Sovereign Code Plugin Registry", version="0.1.0")

# === W6 observability + logging (T17 + T18) =============================
import sys as _sys
from pathlib import Path as _Path
_shared_parent = _Path(__file__).resolve().parents[1]
if str(_shared_parent) not in _sys.path:
    _sys.path.insert(0, str(_shared_parent))
from _shared.observability import setup_metrics as _setup_metrics  # noqa: E402
from _shared.logging import install as _install_logging  # noqa: E402
_install_logging(app, "plugin-registry-service")
_setup_metrics(app, service_name="plugin-registry-service")
# ========================================================================

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


class PluginManifest(BaseModel):
    id: str
    name: str
    version: str
    description: str
    author: str
    hooks: List[str] = []
    enabled: bool = True


class HookEvent(BaseModel):
    hook: str
    payload: dict = {}


@limiter.limit("60/minute")
@app.post("/plugins/register")
async def register_plugin(request: Request, manifest: PluginManifest):
    plugin_registry.register(manifest.model_dump())
    return {"status": "ok", "plugin_id": manifest.id}


@limiter.limit("60/minute")
@app.get("/plugins")
async def list_plugins(request: Request):
    return plugin_registry.list()


@limiter.limit("60/minute")
@app.get("/plugins/{plugin_id}")
async def get_plugin(request: Request, plugin_id: str):
    p = plugin_registry.get(plugin_id)
    if not p:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return p


@limiter.limit("60/minute")
@app.delete("/plugins/{plugin_id}")
async def remove_plugin(request: Request, plugin_id: str):
    removed = plugin_registry.remove(plugin_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return {"status": "ok"}


@limiter.limit("60/minute")
@app.put("/plugins/{plugin_id}/enable")
async def enable_plugin(request: Request, plugin_id: str):
    updated = plugin_registry.set_enabled(plugin_id, True)
    if not updated:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return {"status": "ok"}


@limiter.limit("60/minute")
@app.put("/plugins/{plugin_id}/disable")
async def disable_plugin(request: Request, plugin_id: str):
    updated = plugin_registry.set_enabled(plugin_id, False)
    if not updated:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return {"status": "ok"}


@limiter.limit("60/minute")
@app.post("/hooks/dispatch")
async def dispatch_hook(request: Request, event: HookEvent):
    results = hook_dispatcher.dispatch(event.hook, event.payload)
    return {"status": "ok", "hook": event.hook, "handled_by": results}


@limiter.limit("60/minute")
@app.get("/hooks")
async def list_hooks(request: Request):
    return {"hooks": hook_dispatcher.get_registered_hooks()}


@limiter.limit("60/minute")
@app.get("/health")
async def health(request: Request):
    return {"status": "ok", "version": "0.1.0"}
