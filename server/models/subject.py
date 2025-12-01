from sqlalchemy import Column, Integer, String, UniqueConstraint

from core.database import Base


class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (UniqueConstraint("code", name="uq_subjects_code"),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    code = Column(String, nullable=False, unique=True, index=True)
    semester = Column(String, nullable=True)

