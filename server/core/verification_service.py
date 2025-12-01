"""
Serviciu pentru generarea și validarea codurilor de verificare.
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models.verification_code import VerificationCode
from core.email_service import send_verification_code_email


def generate_verification_code() -> str:
    """Generează un cod de verificare de 6 cifre."""
    return str(random.randint(100000, 999999))


def create_verification_code(
    db: Session,
    user_id: int,
    email: str
) -> VerificationCode:
    """
    Creează un nou cod de verificare pentru un utilizator.
    Invalidează codurile anterioare nefolosite pentru același utilizator.
    """
    # Invalidează codurile anterioare nefolosite
    db.query(VerificationCode).filter(
        VerificationCode.user_id == user_id,
        VerificationCode.verified == 0
    ).delete()
    
    # Generează cod nou
    code = generate_verification_code()
    expires_at = datetime.utcnow() + timedelta(minutes=10)  # Expiră în 10 minute
    
    verification_code = VerificationCode(
        user_id=user_id,
        code=code,
        email=email,
        expires_at=expires_at,
        used=0,
        verified=0
    )
    
    db.add(verification_code)
    db.commit()
    db.refresh(verification_code)
    
    # Trimite codul pe email
    send_verification_code_email(email, code)
    
    return verification_code


def verify_code(
    db: Session,
    user_id: int,
    code: str
) -> tuple[bool, str]:
    """
    Verifică un cod de verificare.
    
    Returns:
        (is_valid, message) - True dacă codul este valid, False altfel cu mesaj de eroare
    """
    verification_code = db.query(VerificationCode).filter(
        VerificationCode.user_id == user_id,
        VerificationCode.code == code,
        VerificationCode.verified == 0
    ).order_by(VerificationCode.created_at.desc()).first()
    
    if not verification_code:
        return False, "Cod de verificare invalid sau deja folosit."
    
    if verification_code.is_expired():
        return False, "Codul de verificare a expirat. Te rugăm să soliciți unul nou."
    
    if verification_code.is_used_up():
        return False, "Ai depășit numărul maxim de încercări. Te rugăm să soliciți un cod nou."
    
    # Marchează codul ca verificat
    verification_code.verified = 1
    db.commit()
    
    return True, "Cod de verificare valid."


def increment_code_attempts(
    db: Session,
    user_id: int,
    code: str
) -> None:
    """Incrementează numărul de încercări pentru un cod."""
    verification_code = db.query(VerificationCode).filter(
        VerificationCode.user_id == user_id,
        VerificationCode.code == code,
        VerificationCode.verified == 0
    ).order_by(VerificationCode.created_at.desc()).first()
    
    if verification_code:
        verification_code.used += 1
        db.commit()

