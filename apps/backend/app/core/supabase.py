import os
from supabase import create_client, Client
from app.core.config import settings

# Initialize the Supabase client using your credentials from settings/.env
supabase_url: str = settings.SUPABASE_URL
supabase_key: str = settings.SUPABASE_KEY
supabase_key: str = settings.SUPABASE_SERVICE_KEY

supabase: Client = create_client(supabase_url, supabase_key)