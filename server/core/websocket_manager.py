"""
WebSocket Manager pentru gestionarea conexiunilor WebSocket și broadcast-ului de mesaje.
"""
from fastapi import WebSocket
from typing import Dict, List, Set
import json
import asyncio


class WebSocketManager:
    """
    Manager pentru gestionarea conexiunilor WebSocket.
    Permite broadcast de mesaje către toți clienții conectați.
    """
    
    def __init__(self):
        # Lista activă de conexiuni WebSocket
        self.active_connections: List[WebSocket] = []
        # Map pentru a stoca informații despre fiecare conexiune (opțional)
        self.connection_info: Dict[WebSocket, dict] = {}
    
    async def connect(self, websocket: WebSocket):
        """Acceptă o nouă conexiune WebSocket."""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_info[websocket] = {
            "connected_at": None  # Poți adăuga mai multe informații aici
        }
        print(f"✓ WebSocket conectat. Total conexiuni: {len(self.active_connections)}")
    
    async def disconnect(self, websocket: WebSocket):
        """Deconectează o conexiune WebSocket."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.connection_info:
            del self.connection_info[websocket]
        print(f"✓ WebSocket deconectat. Total conexiuni: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Trimite un mesaj către un WebSocket specific."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"✗ Eroare la trimiterea mesajului personal: {str(e)}")
            await self.disconnect(websocket)
    
    async def broadcast(self, message: dict):
        """
        Trimite un mesaj către toți clienții conectați.
        Elimină conexiunile închise în timpul trimiterii.
        """
        if not self.active_connections:
            return
        
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"✗ Eroare la broadcast către un client: {str(e)}")
                disconnected.append(connection)
        
        # Elimină conexiunile închise
        for connection in disconnected:
            await self.disconnect(connection)
        
        print(f"📡 Broadcast trimis către {len(self.active_connections)} clienți")
    
    def get_connection_count(self) -> int:
        """Returnează numărul de conexiuni active."""
        return len(self.active_connections)


# Instanță globală a manager-ului WebSocket
websocket_manager = WebSocketManager()

