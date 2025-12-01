import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Enum, Boolean, DateTime

from core.database import Base


class UserRole(enum.Enum):
    STUDENT = 'student'
    PROFESSOR = 'professor'
    ADMIN = 'admin'


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable pentru utilizatori noi care nu au setat încă parola
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)  # True dacă utilizatorul a setat parola
    
    def has_password_set(self) -> bool:
        """Verifică dacă utilizatorul are parolă setată."""
        return self.password_hash is not None and self.password_hash != ''
