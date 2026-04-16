from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        user_id = websocket.query_params.get('user_id') or 'anonymous'
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket):
        for user_connections in self.active_connections.values():
            user_connections.remove(websocket)

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except WebSocketDisconnect:
                    disconnected.append(connection)
            for conn in disconnected:
                self.active_connections[user_id].remove(conn)

    async def broadcast_to_staff(self, message: dict):
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except WebSocketDisconnect:
                    pass

    async def broadcast(self, message: dict):
        for user_connections in self.active_connections.values():
            disconnected = []
            for connection in user_connections:
                try:
                    await connection.send_json(message)
                except WebSocketDisconnect:
                    disconnected.append(connection)
            for conn in disconnected:
                user_connections.remove(conn)

    def get_online_users(self) -> List[str]:
        return list(self.active_connections.keys())

manager = ConnectionManager()
