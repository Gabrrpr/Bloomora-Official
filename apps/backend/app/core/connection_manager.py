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
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        if is_staff:
            self.staff_ids.add(user_id)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.staff_ids.discard(user_id)

    async def send_to_user(self, user_id: str, message: dict):
        for connection in self.active_connections.get(user_id, []):
            try:
                await connection.send_json(message)
            except Exception:
                pass

    async def broadcast_to_staff(self, message: dict):
        for staff_id in self.staff_ids:
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
