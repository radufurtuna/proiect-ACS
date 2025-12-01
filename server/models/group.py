from sqlalchemy import Column, Integer, String, UniqueConstraint

from core.database import Base


class Group(Base):
    __tablename__ = "groups"
    __table_args__ = (UniqueConstraint("code", name="uq_groups_code"),)

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False, unique=True, index=True)
    year = Column(Integer, nullable=True)
    faculty = Column(String, nullable=True)
    specialization = Column(String, nullable=True)

