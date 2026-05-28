# kpn-bridge :: FastAPI Signaling Server
# License: AGPL-3.0

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import signaling, health
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="kpn-bridge Signaling Server",
    description="WebRTC signaling and connection broker for kpn-bridge",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(signaling.router, tags=["Signaling"])
