# kpn-bridge :: Health check router
# License: AGPL-3.0

from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "kpn-bridge signaling server",
        "timestamp": datetime.utcnow().isoformat()
    }
