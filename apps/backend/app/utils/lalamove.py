import hmac
import hashlib
import time
import requests
import json
import uuid
from app.core.config import settings

# Sandbox URL for testing
LALAMOVE_BASE_URL = "https://rest.sandbox.lalamove.com"

def generate_signature(timestamp, method, path, body=""):
    raw_signature = f"{timestamp}\r\n{method}\r\n{path}\r\n\r\n{body}"
    secret_bytes = bytes(settings.LALAMOVE_SECRET, 'utf-8')
    message_bytes = bytes(raw_signature, 'utf-8')
    return hmac.new(secret_bytes, message_bytes, hashlib.sha256).hexdigest()

def make_lalamove_request(method, path, payload=None):
    timestamp = str(int(time.time() * 1000))
    body_str = json.dumps(payload) if payload else ""
    signature = generate_signature(timestamp, method, path, body_str)
    
    headers = {
        "Authorization": f"hmac {settings.LALAMOVE_API_KEY}:{timestamp}:{signature}",
        "Content-Type": "application/json",
        "Market": "PH",
        "Request-ID": str(uuid.uuid4())
    }
    
    response = requests.request(method, f"{LALAMOVE_BASE_URL}{path}", headers=headers, data=body_str)
    response.raise_for_status()
    return response.json()

def book_lalamove_delivery(customer_name: str, customer_phone: str, dropoff_address: str, dropoff_lat: str, dropoff_lng: str):
    # 1. Get Quotation
    quote_payload = {
        "data": {
            "serviceType": "MOTORCYCLE",
            "stops": [
                {"coordinates": {"lat": "14.3214", "lng": "121.0963"}, "address": "Esting's Flowers, Santa Rosa"},
                {"coordinates": {"lat": dropoff_lat, "lng": dropoff_lng}, "address": dropoff_address}
            ],
            "deliveries": [{"toStop": 1, "deliveryInfo": {"stopReason": "DELIVER", "remarks": "Fragile: Fresh Flowers"}}],
            "item": {"quantity": "1", "weight": "LESS_THAN_3_KG", "categories": ["FRAGILE"]}
        }
    }
    quote = make_lalamove_request("POST", "/v3/quotations", quote_payload)
    quotation_id = quote["data"]["quotationId"]
    
    # 2. Place Order
    order_payload = {
        "data": {
            "quotationId": quotation_id,
            "sender": {"name": "Esting's Flowers", "phone": "+639123456789"},
            "recipients": [{"name": customer_name, "phone": customer_phone}]
        }
    }
    order = make_lalamove_request("POST", "/v3/orders", order_payload)
    
    return {
        "lalamove_order_id": order["data"]["orderId"],
        "share_link": order["data"]["shareLink"],
        "status": order["data"]["status"]
    }