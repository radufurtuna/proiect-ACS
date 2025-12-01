from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_admin_user, get_db
from repositories.user_repository import UserRepository
from repositories.group_repository import GroupRepository
from schemas.users import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])
repo = UserRepository()
group_repo = GroupRepository()


def _serialize_user_response(user, db: Session) -> UserResponse:
    """Helper pentru a serializa un user cu informații despre grupă."""
    user_group = repo.get_user_group(db, user.id)
    group_id = None
    group_code = None
    
    if user_group:
        group_id = user_group.group_id
        group = group_repo.get_by_id(db, group_id)
        if group:
            group_code = group.code
    
    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role.value,
        group_id=group_id,
        group_code=group_code
    )


@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    users = repo.list(db)
    return [_serialize_user_response(user, db) for user in users]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    # Creează utilizatorul - dacă parola nu este setată, utilizatorul va fi creat fără parolă (neactiv)
    user = repo.create(db, payload.username, payload.password, payload.role)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username-ul există deja")
    
    # Asociază grupă dacă este specificată și rolul este student
    if payload.group_id is not None and payload.role.value == 'student':
        repo.set_user_group(db, user.id, payload.group_id)
    
    return _serialize_user_response(user, db)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    user = repo.update(
        db,
        user_id,
        username=payload.username,
        password=payload.password,
        role=payload.role,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilizatorul nu există sau username-ul este deja folosit",
        )
    
    # Actualizează grupă dacă este specificată
    if payload.group_id is not None:
        # Verifică dacă rolul este student sau dacă se schimbă la student
        final_role = payload.role.value if payload.role else user.role.value
        if final_role == 'student':
            repo.set_user_group(db, user_id, payload.group_id)
        else:
            # Dacă nu e student, șterge asocierea
            repo.set_user_group(db, user_id, None)
    elif payload.role and payload.role.value != 'student':
        # Dacă se schimbă rolul de la student la altceva, șterge grupă
        repo.set_user_group(db, user_id, None)
    
    # Reîncarcă user-ul pentru a avea datele actualizate
    user = repo.get_by_id(db, user_id)
    return _serialize_user_response(user, db)


@router.delete("/{user_id}", response_model=dict)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    try:
        user = repo.delete(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilizatorul nu există")
        return {"message": f"Utilizatorul cu ID {user_id} a fost șters cu succes"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Eroare la ștergerea utilizatorului {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Eroare la ștergerea utilizatorului: {str(e)}"
        )

