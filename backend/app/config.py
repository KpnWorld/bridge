# kpn-bridge :: Backend configuration
# License: AGPL-3.0

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    port: int = 6767

    class Config:
        env_file = ".env"

settings = Settings()
