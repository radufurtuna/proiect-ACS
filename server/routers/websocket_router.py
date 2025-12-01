"""
Router WebSocket pentru actualizări în timp real ale orarului.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Optional
import json

from core.websocket_manager import websocket_manager

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/schedule")
async def websocket_schedule_endpoint(websocket: WebSocket):
    """
    Endpoint WebSocket pentru actualizări în timp real ale orarului.
    
    Clienții se conectează aici pentru a primi actualizări când:
    - Se creează un nou schedule
    - Se actualizează un schedule existent
    - Se șterge un schedule
    
    Mesajele trimise către client:
    {
        "type": "schedule_update",
        "action": "create|update|delete|refresh_all",
        "schedule": { /* Schedule object */ },
        "all_schedules": [ /* Toate schedule-urile (doar pentru refresh_all) */ ]
    }
    """
    await websocket_manager.connect(websocket)
    
    try:
        # Trimite mesaj de bun venit
        await websocket_manager.send_personal_message({
            "type": "connected",
            "message": "Conectat la server pentru actualizări în timp real",
            "connection_count": websocket_manager.get_connection_count()
        }, websocket)
        
        # Așteaptă mesaje de la client (pentru pinging sau alte comunicări)
        while True:
            try:
                data = await websocket.receive_text()
                # Poți procesa mesaje de la client aici dacă e necesar
                # De exemplu, pentru ping/pong pentru a menține conexiunea activă
                
                # Răspunde la ping
                if data == "ping":
                    await websocket_manager.send_personal_message({
                        "type": "pong"
                    }, websocket)
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"✗ Eroare la primirea mesajului WebSocket: {str(e)}")
                break
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"✗ Eroare WebSocket: {str(e)}")
    finally:
        await websocket_manager.disconnect(websocket)

