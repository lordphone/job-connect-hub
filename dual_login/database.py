# database.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')
SUPABASE_BUCKET = os.getenv('SUPABASE_BUCKET')
SUPABASE_URL_EMPLOYER = os.getenv('SUPABASE_URL_EMPLOYER')
SUPABASE_KEY_EMPLOYER = os.getenv('SUPABASE_KEY_EMPLOYER')

if not all([SUPABASE_URL, SUPABASE_KEY, SUPABASE_JWT_SECRET, SUPABASE_BUCKET]):
    raise EnvironmentError("One or more Supabase environment variables are missing.")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_employer: Client = create_client(SUPABASE_URL_EMPLOYER, SUPABASE_KEY_EMPLOYER)
