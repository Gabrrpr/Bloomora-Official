from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        # user_id -> list of websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # track which user_ids belong to staff/admin
        self.staff_ids: Set[str] = set()

    async def connect(self, websocket: WebSocket, user_id: str, is_staff: bool = False):
        await websocket.accept()
        user_id = str(user_id) # Ensure it's a string
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        if is_staff:
            self.staff_ids.add(user_id)
            
        print(f"🟢 [WS CONNECT] User: {user_id} | is_staff: {is_staff} | Total Staff Online: {len(self.staff_ids)}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        user_id = str(user_id)
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.staff_ids.discard(user_id)

        print(f"🔴 [WS DISCONNECT] User: {user_id} disconnected.")

    async def send_to_user(self, user_id: str, message: dict):
        user_id = str(user_id)
        connections = self.active_connections.get(user_id, [])

        print(f"📬 [WS SEND] Routing message to user {user_id} across {len(connections)} active tabs/devices.")

        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"❌ [WS ERROR] Failed to send to {user_id}: {e}")

    async def broadcast_to_staff(self, message: dict):
        print(f"📢 [WS BROADCAST] Broadcasting to staff. Currently online staff IDs: {self.staff_ids}")
        # Use list() to take a snapshot, preventing 'Set changed size during iteration' crashes
        for staff_id in list(self.staff_ids):
            await self.send_to_user(staff_id, message)

    async def broadcast(self, message: dict):
        for connections in self.active_connections.values():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    def get_online_users(self) -> List[str]:
        return list(self.active_connections.keys())

manager = ConnectionManager()