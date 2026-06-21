import hmac
import hashlib
import base64
import time
import requests
import json
from app.core.config import settings

LALAMOVE_API_KEY = "your_api_key_here"
LALAMOVE_SECRET = "your_secret_here"
LALAMOVE_BASE_URL = "https://rest.sandbox.lalamove.com" # Change to production later

def generate_signature(timestamp, method, path, body=""):
    raw_signature = f"{timestamp}\r\n{method}\r\n{path}\r\n\r\n{body}"
    secret_bytes = bytes(LALAMOVE_SECRET, 'utf-8')
    message_bytes = bytes(raw_signature, 'utf-8')
    
    signature = hmac.new(secret_bytes, message_bytes, hashlib.sha256).hexdigest()
    return signature

def place_lalamove_order(order_data: dict):
    path = "/v3/orders"
    method = "POST"
    timestamp = str(int(time.time() * 1000))
    body_str = json.dumps(order_data)
    
    signature = generate_signature(timestamp, method, path, body_str)
    
    headers = {
        "Authorization": f"hmac {LALAMOVE_API_KEY}:{timestamp}:{signature}",
        "Content-Type": "application/json",
        "Market": "PH" # Philippines
    }
    
    response = requests.post(f"{LALAMOVE_BASE_URL}{path}", headers=headers, data=body_str)
    return response.json()