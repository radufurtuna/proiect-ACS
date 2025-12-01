from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_admin_user, get_current_user, get_db
from models.user import User
from repositories.subject_repository import SubjectRepository
from schemas.reference import SubjectCreate, SubjectResponse, SubjectUpdate

router = APIRouter(prefix="/subjects", tags=["Subjects"])
repo = SubjectRepository()


@router.get("/", response_model=List[SubjectResponse])
def list_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return repo.get_all(db)


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = repo.get_by_id(db, subject_id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disciplina nu a fost găsită")
    return subject


@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    return repo.create(db, payload)


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    subject = repo.update(db, subject_id, payload)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disciplina nu a fost găsită")
    return subject


@router.delete("/{subject_id}", response_model=dict)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    subject = repo.delete(db, subject_id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disciplina nu a fost găsită")
    return {"message": f"Disciplina cu ID {subject_id} a fost ștearsă cu succes"}

