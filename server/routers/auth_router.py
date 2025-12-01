from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import SessionLocal
from core.dependencies import get_db, get_admin_user
from core.security import verify_password, create_access_token
from core.verification_service import (
    create_verification_code,
    verify_code,
    increment_code_attempts
)
from models.user import UserRole, User
from repositories.user_repository import UserRepository
from schemas.users import UserCreate, UserLogin, UserResponse, Token
from schemas.auth import (
    CheckEmailRequest,
    CheckEmailResponse,
    SendVerificationCodeRequest,
    SendVerificationCodeResponse,
    VerifyCodeAndSetPasswordRequest,
    VerifyCodeAndSetPasswordResponse,
    LoginRequest
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/check-email", response_model=CheckEmailResponse)
def check_email(request: CheckEmailRequest, db: Session = Depends(get_db)):
    """
    Verifică dacă un email există în baza de date și dacă utilizatorul are parolă setată.
    """
    user_repo = UserRepository()
    user = user_repo.get_by_username(db, request.email.lower())

    if not user:
        return CheckEmailResponse(
            exists=False,
            has_password=False,
            message="Email-ul nu există în sistem. Contactează administratorul pentru a fi adăugat."
        )

    has_password = user.has_password_set()

    if has_password:
        return CheckEmailResponse(
            exists=True,
            has_password=True,
            message="Email-ul există și utilizatorul are parolă setată."
        )
    else:
        return CheckEmailResponse(
            exists=True,
            has_password=False,
            message="Email-ul există, dar utilizatorul nu are parolă setată. Poți seta parola acum."
        )


@router.post("/send-verification-code", response_model=SendVerificationCodeResponse)
def send_verification_code(request: SendVerificationCodeRequest, db: Session = Depends(get_db)):
    """
    Trimite un cod de verificare pe email pentru setarea parolei.
    """
    user_repo = UserRepository()
    user = user_repo.get_by_username(db, request.email.lower())

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email-ul nu există în sistem."
        )

    if user.has_password_set():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilizatorul are deja parolă setată. Folosește login normal."
        )

    try:
        create_verification_code(db, user.id, request.email.lower())
        return SendVerificationCodeResponse(
            success=True,
            message="Cod de verificare trimis cu succes pe email."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Eroare la trimiterea codului: {str(e)}"
        )


@router.post("/verify-code-and-set-password", response_model=VerifyCodeAndSetPasswordResponse)
def verify_code_and_set_password(
    request: VerifyCodeAndSetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Verifică codul de verificare și setează parola pentru utilizator.
    După setarea parolei, returnează token JWT pentru login automat.
    """
    user_repo = UserRepository()
    user = user_repo.get_by_username(db, request.email.lower())

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email-ul nu există în sistem."
        )

    if user.has_password_set():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilizatorul are deja parolă setată. Folosește login normal."
        )

    # Verifică codul
    is_valid, message = verify_code(db, user.id, request.code)

    if not is_valid:
        # Incrementează numărul de încercări
        increment_code_attempts(db, user.id, request.code)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    # Setează parola
    password_set = user_repo.set_password(db, user.id, request.password)

    if not password_set:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la setarea parolei."
        )

    # Creează token JWT pentru login automat
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value}
    )

    return VerifyCodeAndSetPasswordResponse(
        success=True,
        message="Parolă setată cu succes. Te-ai autentificat automat.",
        access_token=access_token,
        token_type="bearer",
        role=user.role.value
    )


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentificare utilizator cu email și parolă.
    Funcționează doar pentru utilizatorii care au deja parolă setată.
    """
    user_repo = UserRepository()
    user = user_repo.get_by_username(db, credentials.email.lower())

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email sau parolă incorectă",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.has_password_set():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilizatorul nu are parolă setată. Folosește flow-ul de setare parolă."
        )

    # Verifică parola - aici password_hash nu poate fi None pentru că am verificat has_password_set() mai sus
    if not user.password_hash or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email sau parolă incorectă",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Creează token JWT
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value}
    )

    return Token(access_token=access_token, token_type="bearer", role=user.role.value)
