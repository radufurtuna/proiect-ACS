from sqlalchemy import Column, Integer, String, UniqueConstraint

from core.database import Base


class Professor(Base):
    __tablename__ = "professors"
    __table_args__ = (UniqueConstraint("email", name="uq_professors_email"),)

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False, index=True)
    department = Column(String, nullable=True)
    email = Column(String, nullable=True, unique=True)

