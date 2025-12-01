"""
Model pentru codurile de verificare trimise pe email pentru setarea parolei.
"""
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index

from core.database import Base


class VerificationCode(Base):
    """Cod de verificare de 6 cifre pentru setarea parolei."""
    __tablename__ = "verification_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String(6), nullable=False)  # Cod de 6 cifre
    email = Column(String, nullable=False)  # Email-ul la care a fost trimis codul
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)  # Expiră după 10 minute
    used = Column(Integer, default=0, nullable=False)  # Număr de încercări (max 3)
    verified = Column(Integer, default=0, nullable=False)  # 0 = neverificat, 1 = verificat
    
    __table_args__ = (
        Index('ix_verification_codes_user_id', 'user_id'),
        Index('ix_verification_codes_code', 'code'),
    )
    
    def is_expired(self) -> bool:
        """Verifică dacă codul a expirat."""
        return datetime.utcnow() > self.expires_at
    
    def is_used_up(self) -> bool:
        """Verifică dacă s-au epuizat încercările (max 3)."""
        return self.used >= 3
    
    def is_verified(self) -> bool:
        """Verifică dacă codul a fost deja folosit pentru setarea parolei."""
        return self.verified == 1

