# kpn-bridge :: Supabase service role client
# License: AGPL-3.0

from supabase import create_client, Client
from app.config import settings

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)
