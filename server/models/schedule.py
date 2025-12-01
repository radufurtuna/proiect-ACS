import enum

from sqlalchemy import Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from core.database import Base


class SessionType(str, enum.Enum):
    COURSE = "course"
    SEMINAR = "seminar"
    LAB = "lab"


class SessionStatus(str, enum.Enum):
    NORMAL = "normal"
    MOVED = "moved"
    CANCELED = "canceled"


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    professor_id = Column(Integer, ForeignKey("professors.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    day = Column(String, nullable=False)  # Day of the week
    hour = Column(String, nullable=False)  # Time interval (e.g. 08:00–09:45)
    session_type = Column(Enum(SessionType), default=SessionType.COURSE, nullable=False)
    status = Column(Enum(SessionStatus), default=SessionStatus.NORMAL, nullable=False)
    notes = Column(String, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    
    # Câmpuri pentru săptămâna impară (opționale)
    odd_week_subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    odd_week_professor_id = Column(Integer, ForeignKey("professors.id"), nullable=True)
    odd_week_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)

    group = relationship("Group")
    
    # Relații normale - trebuie să specificăm explicit foreign_keys pentru a evita ambiguitatea
    subject = relationship("Subject", foreign_keys=[subject_id])
    professor = relationship("Professor", foreign_keys=[professor_id])
    room = relationship("Room", foreign_keys=[room_id])
    
    # Relații pentru săptămâna impară
    odd_week_subject = relationship("Subject", foreign_keys=[odd_week_subject_id])
    odd_week_professor = relationship("Professor", foreign_keys=[odd_week_professor_id])
    odd_week_room = relationship("Room", foreign_keys=[odd_week_room_id])
