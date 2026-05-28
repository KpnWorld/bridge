# kpn-bridge :: JWT auth dependency
# License: AGPL-3.0

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
import httpx

bearer_scheme = HTTPBearer()

async def get_jwks() -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")
        res.raise_for_status()
        return res.json()

async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> dict:
    token = credentials.credentials
    try:
        jwks = await get_jwks()
        keys = jwks.get("keys", [])
        payload = jwt.decode(
            token,
            keys,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
