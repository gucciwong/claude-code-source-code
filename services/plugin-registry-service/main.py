from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from registry.registry import plugin_registry, hook_dispatcher

app = FastAPI(title="Sovereign Code Plugin Registry", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


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


@app.post("/plugins/register")
async def register_plugin(manifest: PluginManifest):
    plugin_registry.register(manifest.dict())
    return {"status": "ok", "plugin_id": manifest.id}


@app.get("/plugins")
async def list_plugins():
    return plugin_registry.list()


@app.get("/plugins/{plugin_id}")
async def get_plugin(plugin_id: str):
    p = plugin_registry.get(plugin_id)
    if not p:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return p


@app.delete("/plugins/{plugin_id}")
async def remove_plugin(plugin_id: str):
    removed = plugin_registry.remove(plugin_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return {"status": "ok"}


@app.put("/plugins/{plugin_id}/enable")
async def enable_plugin(plugin_id: str):
    updated = plugin_registry.set_enabled(plugin_id, True)
    if not updated:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return {"status": "ok"}


@app.put("/plugins/{plugin_id}/disable")
async def disable_plugin(plugin_id: str):
    updated = plugin_registry.set_enabled(plugin_id, False)
    if not updated:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return {"status": "ok"}


@app.post("/hooks/dispatch")
async def dispatch_hook(event: HookEvent):
    results = hook_dispatcher.dispatch(event.hook, event.payload)
    return {"status": "ok", "hook": event.hook, "handled_by": results}


@app.get("/hooks")
async def list_hooks():
    return {"hooks": hook_dispatcher.get_registered_hooks()}


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
