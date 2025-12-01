from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from core.database import SessionLocal
from core.security import decode_access_token
from models.user import UserRole
from repositories.user_repository import UserRepository

security = HTTPBearer()


def get_db():
    """Dependency pentru obținerea sesiunii de bază de date."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Dependency pentru obținerea utilizatorului curent autentificat."""
    token = credentials.credentials
    payload = decode_access_token(token)
    username: str = payload.get("sub")
    
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid",
        )
    
    user_repo = UserRepository()
    user = user_repo.get_by_username(db, username)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilizator nu a fost găsit",
        )
    
    return user


def get_admin_user(current_user = Depends(get_current_user)):
    """Dependency pentru verificarea că utilizatorul este admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acces interzis. Doar administratorii pot accesa această resursă.",
        )
    return current_user

