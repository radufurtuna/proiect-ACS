"""
Script pentru inițializarea bazei de date.
Creează toate tabelele necesare.
"""
from core.database import Base, engine
from models import (
    AssessmentSchedule,
    Group,
    Professor,
    Room,
    Schedule,
    Subject,
    User,
    UserGroup,
    VerificationCode,
)

def init_database():
    """Creează toate tabelele în baza de date."""
    print("Creând tabelele în baza de date...")
    Base.metadata.create_all(bind=engine)
    print("✓ Baza de date a fost inițializată cu succes!")
    print("✓ Tabele create/actualizate: groups, professors, subjects, rooms, schedules, users, user_groups, verification_codes, assessment_schedules")

if __name__ == "__main__":
    init_database()

