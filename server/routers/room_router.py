from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_admin_user, get_current_user, get_db
from models.user import User
from repositories.room_repository import RoomRepository
from schemas.reference import RoomCreate, RoomResponse, RoomUpdate

router = APIRouter(prefix="/rooms", tags=["Rooms"])
repo = RoomRepository()


@router.get("/", response_model=List[RoomResponse])
def list_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return repo.get_all(db)


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = repo.get_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala nu a fost găsită")
    return room


@router.post("/", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    return repo.create(db, payload)


@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int,
    payload: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    room = repo.update(db, room_id, payload)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala nu a fost găsită")
    return room


@router.delete("/{room_id}", response_model=dict)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    room = repo.delete(db, room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala nu a fost găsită")
    return {"message": f"Sala cu ID {room_id} a fost ștearsă cu succes"}

