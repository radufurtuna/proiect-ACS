from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_admin_user, get_current_user, get_db
from models.user import User
from repositories.professor_repository import ProfessorRepository
from schemas.reference import ProfessorCreate, ProfessorResponse, ProfessorUpdate

router = APIRouter(prefix="/professors", tags=["Professors"])
repo = ProfessorRepository()


@router.get("/", response_model=List[ProfessorResponse])
def list_professors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return repo.get_all(db)


@router.get("/{professor_id}", response_model=ProfessorResponse)
def get_professor(
    professor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    professor = repo.get_by_id(db, professor_id)
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profesorul nu a fost găsit")
    return professor


@router.post("/", response_model=ProfessorResponse, status_code=status.HTTP_201_CREATED)
def create_professor(
    payload: ProfessorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    return repo.create(db, payload)


@router.put("/{professor_id}", response_model=ProfessorResponse)
def update_professor(
    professor_id: int,
    payload: ProfessorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    professor = repo.update(db, professor_id, payload)
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profesorul nu a fost găsit")
    return professor


@router.delete("/{professor_id}", response_model=dict)
def delete_professor(
    professor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    professor = repo.delete(db, professor_id)
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profesorul nu a fost găsit")
    return {"message": f"Profesorul cu ID {professor_id} a fost șters cu succes"}

