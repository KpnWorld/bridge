# kpn-bridge :: Pydantic models
# License: AGPL-3.0

from pydantic import BaseModel
from typing import Literal

class SDPMessage(BaseModel):
    type: Literal["offer", "answer"]
    sdp: str

class ICECandidate(BaseModel):
    candidate: str
    sdpMid: str | None = None
    sdpMLineIndex: int | None = None

class SignalMessage(BaseModel):
    event: Literal["offer", "answer", "ice_candidate", "register", "ping"]
    machine_id: str
    payload: dict | None = None

class MachineStatusUpdate(BaseModel):
    machine_id: str
    status: Literal["online", "offline", "degraded"]
    agent_version: str | None = None
