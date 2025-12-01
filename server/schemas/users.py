from pydantic import BaseModel

from models.user import UserRole


class UserCreate(BaseModel):
    username: str
    password: str | None = None  # Opțional - dacă nu este setat, utilizatorul va fi creat fără parolă
    role: UserRole
    group_id: int | None = None  # Doar pentru studenți


class UserUpdate(BaseModel):
    username: str | None = None
    password: str | None = None
    role: UserRole | None = None
    group_id: int | None = None  # Doar pentru studenți


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    group_id: int | None = None  # ID-ul grupei asociate
    group_code: str | None = None  # Codul grupei pentru afișare

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str  # Rolul utilizatorului (admin sau student)

