from slowapi import Limiter
from slowapi.util import get_remote_address

# Define the limiter here, completely independent of main.py
limiter = Limiter(key_func=get_remote_address)