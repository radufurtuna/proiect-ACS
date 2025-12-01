from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_admin_user, get_current_user, get_db
from models.user import User
from repositories.group_repository import GroupRepository
from schemas.reference import GroupCreate, GroupResponse, GroupUpdate

router = APIRouter(prefix="/groups", tags=["Groups"])
repo = GroupRepository()


@router.get("/", response_model=List[GroupResponse])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return repo.get_all(db)


@router.get("/{group_id}", response_model=GroupResponse)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = repo.get_by_id(db, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupa nu a fost găsită")
    return group


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    payload: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    return repo.create(db, payload)


@router.put("/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: int,
    payload: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    group = repo.update(db, group_id, payload)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupa nu a fost găsită")
    return group


@router.delete("/{group_id}", response_model=dict)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    group = repo.delete(db, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupa nu a fost găsită")
    return {"message": f"Grupa cu ID {group_id} a fost ștearsă cu succes"}

