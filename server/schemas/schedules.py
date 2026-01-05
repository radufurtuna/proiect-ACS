from typing import Literal

from pydantic import BaseModel

from .reference import (
    GroupResponse,
    ProfessorResponse,
    RoomResponse,
    SubjectResponse,
)

SessionTypeLiteral = Literal["course", "seminar", "lab"]
SessionStatusLiteral = Literal["normal", "moved", "canceled"]


class ScheduleBase(BaseModel):
    group_id: int
    subject_id: int
    professor_id: int
    room_id: int
    day: str
    hour: str
    session_type: SessionTypeLiteral = "course"
    status: SessionStatusLiteral = "normal"
    notes: str | None = None
    odd_week_subject_id: int | None = None
    odd_week_professor_id: int | None = None
    odd_week_room_id: int | None = None
    academic_year: int | None = None  # Anul academic (1, 2, 3, 4)
    semester: str | None = None  # Semestrul (ex: "semester1", "semester2", "assessments1", "exams", "assessments2")
    cycle_type: str | None = None  # Tipul de ciclu (ex: "F" pentru Frecvență, "FR" pentru Frecvență Redusă)


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    group_id: int | None = None
    subject_id: int | None = None
    professor_id: int | None = None
    room_id: int | None = None
    day: str | None = None
    hour: str | None = None
    session_type: SessionTypeLiteral | None = None
    status: SessionStatusLiteral | None = None
    notes: str | None = None
    odd_week_subject_id: int | None = None
    odd_week_professor_id: int | None = None
    odd_week_room_id: int | None = None
    academic_year: int | None = None
    semester: str | None = None
    cycle_type: str | None = None


class ScheduleResponse(BaseModel):
    id: int
    day: str
    hour: str
    session_type: SessionTypeLiteral
    status: SessionStatusLiteral
    notes: str | None
    version: int
    group: GroupResponse
    subject: SubjectResponse
    professor: ProfessorResponse
    room: RoomResponse
    odd_week_subject: SubjectResponse | None = None
    odd_week_professor: ProfessorResponse | None = None
    odd_week_room: RoomResponse | None = None
    academic_year: int | None = None
    semester: str | None = None
    cycle_type: str | None = None

    class Config:
        from_attributes = True
