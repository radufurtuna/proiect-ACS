"""
Schemas pentru flow-ul de autentificare în două pași.
"""
from pydantic import BaseModel, EmailStr


class CheckEmailRequest(BaseModel):
    """Request pentru verificarea email-ului."""
    email: EmailStr


class CheckEmailResponse(BaseModel):
    """Response pentru verificarea email-ului."""
    exists: bool
    has_password: bool  # True dacă utilizatorul are parolă setată
    message: str


class SendVerificationCodeRequest(BaseModel):
    """Request pentru trimiterea codului de verificare."""
    email: EmailStr


class SendVerificationCodeResponse(BaseModel):
    """Response pentru trimiterea codului de verificare."""
    success: bool
    message: str


class VerifyCodeAndSetPasswordRequest(BaseModel):
    """Request pentru verificarea codului și setarea parolei."""
    email: EmailStr
    code: str  # Cod de 6 cifre
    password: str


class VerifyCodeAndSetPasswordResponse(BaseModel):
    """Response pentru verificarea codului și setarea parolei."""
    success: bool
    message: str
    access_token: str | None = None
    token_type: str | None = None
    role: str | None = None


class LoginRequest(BaseModel):
    """Request pentru login normal (când utilizatorul are deja parolă)."""
    email: EmailStr
    password: str

