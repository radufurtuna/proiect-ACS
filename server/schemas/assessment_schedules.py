from pydantic import BaseModel


class AssessmentScheduleBase(BaseModel):
    """Schema de bază pentru o evaluare periodică."""
    subject: str  # Numele disciplinei (scris manual)
    groups_composition: str  # Componența seriei - grupele separate prin virgulă (ex: "TI-221, TI-222, TI-223")
    professor_name: str  # Cadrul didactic titular (scris manual)
    assessment_date: str  # Data evaluării (scris manual, ex: "2024-01-15")
    assessment_time: str  # Ora evaluării (scris manual, ex: "14:00")
    room_code: str  # Codul sălii (scris manual)
    academic_year: int  # Anul academic (1, 2, 3, 4)
    semester: str  # "assessments1" sau "assessments2"
    cycle_type: str | None = None  # "F" sau "FR"


class AssessmentScheduleCreate(AssessmentScheduleBase):
    """Schema pentru crearea unei evaluări periodice."""
    pass


class AssessmentScheduleUpdate(BaseModel):
    """Schema pentru actualizarea unei evaluări periodice."""
    subject: str | None = None
    groups_composition: str | None = None
    professor_name: str | None = None
    assessment_date: str | None = None
    assessment_time: str | None = None
    room_code: str | None = None
    academic_year: int | None = None
    semester: str | None = None
    cycle_type: str | None = None


class AssessmentScheduleResponse(AssessmentScheduleBase):
    """Schema pentru răspunsul API cu o evaluare periodică."""
    id: int

    class Config:
        from_attributes = True
