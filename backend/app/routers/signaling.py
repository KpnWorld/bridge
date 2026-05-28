# kpn-bridge :: WebRTC Signaling Router
# License: AGPL-3.0

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.supabase_client import supabase
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class ConnectionRegistry:
    def __init__(self):
        self.agents: dict[str, WebSocket] = {}
        self.browsers: dict[str, list[WebSocket]] = {}

    async def register_agent(self, machine_id: str, ws: WebSocket):
        self.agents[machine_id] = ws
        logger.info(f"Agent registered: {machine_id}")
        await self._update_machine_status(machine_id, "online")

    async def unregister_agent(self, machine_id: str):
        self.agents.pop(machine_id, None)
        logger.info(f"Agent disconnected: {machine_id}")
        await self._update_machine_status(machine_id, "offline")

    def register_browser(self, machine_id: str, ws: WebSocket):
        if machine_id not in self.browsers:
            self.browsers[machine_id] = []
        self.browsers[machine_id].append(ws)

    def unregister_browser(self, machine_id: str, ws: WebSocket):
        if machine_id in self.browsers:
            self.browsers[machine_id].remove(ws)

    async def relay_to_agent(self, machine_id: str, message: dict) -> bool:
        ws = self.agents.get(machine_id)
        if not ws:
            return False
        await ws.send_text(json.dumps(message))
        return True

    async def relay_to_browsers(self, machine_id: str, message: dict):
        for ws in self.browsers.get(machine_id, []):
            await ws.send_text(json.dumps(message))

    async def _update_machine_status(self, machine_id: str, status: str):
        try:
            supabase.table("machines").update(
                {"status": status, "last_seen_at": "now()"}
            ).eq("id", machine_id).execute()
        except Exception as e:
            logger.error(f"Failed to update machine status: {e}")

registry = ConnectionRegistry()

@router.websocket("/ws/agent/{machine_id}")
async def agent_endpoint(
    websocket: WebSocket,
    machine_id: str,
    token: str = Query(...)
):
    await websocket.accept()
    try:
        result = supabase.table("machines").select("id, org_id").eq("id", machine_id).single().execute()
        if not result.data:
            await websocket.close(code=4004, reason="Machine not found")
            return
    except Exception:
        await websocket.close(code=4004, reason="Machine not found")
        return

    await registry.register_agent(machine_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)
            await registry.relay_to_browsers(machine_id, message)
    except WebSocketDisconnect:
        await registry.unregister_agent(machine_id)
    except Exception as e:
        logger.error(f"Agent WS error [{machine_id}]: {e}")
        await registry.unregister_agent(machine_id)

@router.websocket("/ws/browser/{machine_id}")
async def browser_endpoint(
    websocket: WebSocket,
    machine_id: str,
    token: str = Query(...)
):
    await websocket.accept()
    if machine_id not in registry.agents:
        await websocket.send_text(json.dumps({
            "event": "error",
            "detail": "Agent is offline or not connected"
        }))
        await websocket.close(code=4003, reason="Agent offline")
        return

    registry.register_browser(machine_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)
            delivered = await registry.relay_to_agent(machine_id, message)
            if not delivered:
                await websocket.send_text(json.dumps({
                    "event": "error",
                    "detail": "Agent went offline"
                }))
    except WebSocketDisconnect:
        registry.unregister_browser(machine_id, websocket)
    except Exception as e:
        logger.error(f"Browser WS error [{machine_id}]: {e}")
        registry.unregister_browser(machine_id, websocket)
