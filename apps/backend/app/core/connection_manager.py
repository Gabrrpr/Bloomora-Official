from fastapi import WebSocket
from typing import Dict, List


class ConnectionManager:
    """
    Manages active WebSocket connections.
    Tracks connections per user_id so staff can broadcast
    to a specific customer and vice versa.
    """

    def __init__(self):
        # { user_id: [WebSocket, ...] }
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to all connections of a specific user."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

    async def broadcast_to_staff(self, message: dict, staff_ids: List[str]):
        """Broadcast a customer message to all online staff."""
        for staff_id in staff_ids:
            await self.send_to_user(staff_id, message)

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    def get_online_users(self) -> List[str]:
        return list(self.active_connections.keys())


# Singleton instance — imported across the app
manager = ConnectionManager()