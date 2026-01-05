from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import asyncio

from core.dependencies import get_admin_user, get_db
from core.websocket_manager import websocket_manager
from models.user import User
from repositories.schedule_repository import ScheduleRepository
from schemas.schedules import ScheduleCreate, ScheduleResponse, ScheduleUpdate

router = APIRouter(prefix="/schedule", tags=["Schedule"])


async def _broadcast_schedule_update(action: str, schedule: ScheduleResponse = None, all_schedules: List[ScheduleResponse] = None):
    """
    Trimite actualizare WebSocket către toți clienții conectați.
    
    Args:
        action: "create", "update", "delete", sau "refresh_all"
        schedule: Schedule-ul care a fost modificat (pentru create/update/delete)
        all_schedules: Lista completă de schedule-uri (pentru refresh_all)
    """
    message = {
        "type": "schedule_update",
        "action": action,
        "timestamp": None  # Poți adăuga timestamp dacă vrei
    }
    
    if action == "refresh_all" and all_schedules is not None:
        # Pentru refresh_all, trimitem toate schedule-urile
        message["all_schedules"] = [schedule.model_dump() for schedule in all_schedules]
    elif schedule is not None:
        # Pentru create/update/delete, trimitem doar schedule-ul afectat
        message["schedule"] = schedule.model_dump()
    
    # Emite mesajul către toți clienții (non-blocking)
    asyncio.create_task(websocket_manager.broadcast(message))


def _serialize_schedule(schedule) -> ScheduleResponse:
    try:
        return ScheduleResponse.model_validate(schedule)
    except Exception as e:
        # Log eroarea pentru debugging
        print(f"Eroare la serializarea schedule-ului cu ID {schedule.id}: {str(e)}")
        raise ValueError(f"Eroare la serializarea datelor pentru schedule ID {schedule.id}: {str(e)}")


@router.get("/", response_model=List[ScheduleResponse])
def get_all_schedules(
    academic_year: int | None = None,
    semester: str | None = None,
    cycle_type: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Obține toate schedule-urile, opțional filtrate după an academic, semestru și tip de ciclu.
    """
    try:
        repo = ScheduleRepository()
        schedules = repo.get_all(db, academic_year=academic_year, semester=semester, cycle_type=cycle_type)
        result = []
        for s in schedules:
            try:
                result.append(_serialize_schedule(s))
            except Exception as e:
                # Sare peste schedule-urile care nu pot fi serializate și continuă cu restul
                print(f"Eroare la serializarea schedule-ului cu ID {s.id}: {str(e)}")
                continue
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Eroare la încărcarea orarului: {str(e)}"
        )


@router.get("/{group_code}", response_model=List[ScheduleResponse])
def get_schedule_by_group(
    group_code: str,
    db: Session = Depends(get_db),
):
    try:
        repo = ScheduleRepository()
        schedules = repo.get_by_group_code(db, group_code)
        result = []
        for s in schedules:
            try:
                result.append(_serialize_schedule(s))
            except Exception as e:
                # Sare peste schedule-urile care nu pot fi serializate și continuă cu restul
                print(f"Eroare la serializarea schedule-ului cu ID {s.id}: {str(e)}")
                continue
        return result
    except Exception as e:
        # Dacă grupul nu există sau nu are schedule-uri, returnează o listă goală
        # în loc de o eroare 500
        print(f"Eroare la încărcarea orarului pentru grupul {group_code}: {str(e)}")
        return []


@router.get("/id/{schedule_id}", response_model=ScheduleResponse)
def get_schedule_by_id(
    schedule_id: int,
    db: Session = Depends(get_db),
):
    repo = ScheduleRepository()
    schedule = repo.get_by_id(db, schedule_id)

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orarul nu a fost găsit",
        )

    return _serialize_schedule(schedule)


@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def add_schedule(
    item: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    repo = ScheduleRepository()
    new_schedule = repo.create(db, item)
    serialized = _serialize_schedule(new_schedule)
    
    # Emite WebSocket update
    await _broadcast_schedule_update("create", schedule=serialized)
    
    return serialized


@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    item: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    repo = ScheduleRepository()
    updated_schedule = repo.update(db, schedule_id, item)

    if not updated_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cursul nu a fost găsit",
        )

    serialized = _serialize_schedule(updated_schedule)
    
    # Emite WebSocket update
    await _broadcast_schedule_update("update", schedule=serialized)
    
    return serialized


@router.delete("/{schedule_id}", response_model=dict)
async def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    repo = ScheduleRepository()
    
    # Obține schedule-ul înainte de ștergere pentru a-l trimite în mesajul WebSocket
    schedule_to_delete = repo.get_by_id(db, schedule_id)
    
    deleted_schedule = repo.delete(db, schedule_id)

    if not deleted_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cursul nu a fost găsit",
        )

    # Emite WebSocket update cu datele schedule-ului șters
    if schedule_to_delete:
        serialized = _serialize_schedule(schedule_to_delete)
        await _broadcast_schedule_update("delete", schedule=serialized)

    return {"message": f"Cursul cu ID {schedule_id} a fost șters cu succes!"}


@router.post("/refresh-all", response_model=dict)
async def refresh_all_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """
    Endpoint pentru a trimite un refresh_all către toți clienții conectați.
    Utilizat după operații batch pentru a actualiza toți clienții dintr-o dată.
    """
    repo = ScheduleRepository()
    schedules = repo.get_all(db)
    all_schedules = []
    for s in schedules:
        try:
            all_schedules.append(_serialize_schedule(s))
        except Exception as e:
            print(f"Eroare la serializarea schedule-ului cu ID {s.id}: {str(e)}")
            continue
    
    await _broadcast_schedule_update("refresh_all", all_schedules=all_schedules)
    
    return {"message": f"Refresh trimis către {websocket_manager.get_connection_count()} clienți", "schedules_count": len(all_schedules)}

