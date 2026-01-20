from sqlalchemy import Column, Integer, String

from core.database import Base


class AssessmentSchedule(Base):
    """
    Tabel pentru evaluările periodice.
    Un rând = o disciplină cu toate datele (grupe, profesor, dată, oră, sală).
    Toate grupele sunt într-un singur câmp text, separate prin virgulă.
    """
    __tablename__ = "assessment_schedules"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=False)  # Numele disciplinei (scris manual)
    groups_composition = Column(String, nullable=False)  # Componența seriei - grupele separate prin virgulă (ex: "TI-221, TI-222, TI-223")
    professor_name = Column(String, nullable=False)  # Cadrul didactic titular (scris manual)
    assessment_date = Column(String, nullable=False)  # Data evaluării (scris manual, ex: "2024-01-15")
    assessment_time = Column(String, nullable=False)  # Ora evaluării (scris manual, ex: "14:00")
    room_code = Column(String, nullable=False)  # Codul sălii (scris manual)
    academic_year = Column(Integer, nullable=False)  # Anul academic (1, 2, 3, 4)
    semester = Column(String, nullable=False)  # "assessments1" sau "assessments2"
    cycle_type = Column(String, nullable=True)  # "F" sau "FR"
