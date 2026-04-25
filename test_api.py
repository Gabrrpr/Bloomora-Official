import urllib.request
import json

headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMzQwODM3ZS1hZGM1LTRlOGUtYmM1NS03MjcxZTE2MmFlMGUiLCJleHAiOjE3NzcxMzY4OTN9.uJjCqAs0AI76rQ94W8yPYwG00NzeHUPOHQDtE5o66J0"
}

data = json.dumps({
    "prompt_text": "test",
    "flower_id": "a1000000-0000-0000-0000-000000000001",
    "vase_id": "a2000000-0000-0000-0000-000000000001",
    "wrapping_id": "a3000000-0000-0000-0000-000000000001",
    "accessory_id": "a4000000-0000-0000-0000-000000000001"
}).encode()

req = urllib.request.Request(
    'http://localhost:8000/api/v1/customization/check-and-generate',
    data=data,
    headers=headers,
    method='POST'
)

try:
    resp = urllib.request.urlopen(req)
    print('OK:', resp.status)
    print(resp.read().decode()[:2000])
except Exception as e:
    print('STATUS:', e.code if hasattr(e, 'code') else 'N/A')
    body = e.read().decode() if hasattr(e, 'read') else str(e)
    print('BODY:', body[:3000])
