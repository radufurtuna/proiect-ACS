from sqlalchemy.orm import Session
from typing import List

from models.assessment_schedule import AssessmentSchedule
from schemas.assessment_schedules import (
    AssessmentScheduleCreate,
    AssessmentScheduleUpdate,
)


class AssessmentScheduleRepository:
    """Repository class responsible for all database operations related to assessment schedules."""

    def get_all(
        self,
        db: Session,
        academic_year: int | None = None,
        semester: str | None = None,
        cycle_type: str | None = None,
    ) -> List[AssessmentSchedule]:
        """
        Obține toate evaluările periodice, opțional filtrate după an academic, semestru și tip de ciclu.
        """
        query = db.query(AssessmentSchedule)

        if academic_year is not None:
            query = query.filter(AssessmentSchedule.academic_year == academic_year)
        if semester is not None:
            query = query.filter(AssessmentSchedule.semester == semester)
        if cycle_type is not None:
            query = query.filter(AssessmentSchedule.cycle_type == cycle_type)

        return query.order_by(AssessmentSchedule.subject).all()

    def get_by_id(self, db: Session, assessment_schedule_id: int) -> AssessmentSchedule | None:
        """Obține o evaluare periodică după ID."""
        return db.query(AssessmentSchedule).filter(AssessmentSchedule.id == assessment_schedule_id).first()

    def create(self, db: Session, assessment_data: AssessmentScheduleCreate) -> AssessmentSchedule:
        """Creează o nouă evaluare periodică."""
        new_assessment = AssessmentSchedule(
            subject=assessment_data.subject,
            groups_composition=assessment_data.groups_composition,
            professor_name=assessment_data.professor_name,
            assessment_date=assessment_data.assessment_date,
            assessment_time=assessment_data.assessment_time,
            room_code=assessment_data.room_code,
            academic_year=assessment_data.academic_year,
            semester=assessment_data.semester,
            cycle_type=assessment_data.cycle_type,
        )
        db.add(new_assessment)
        db.commit()
        db.refresh(new_assessment)
        return new_assessment

    def update(
        self,
        db: Session,
        assessment_schedule_id: int,
        update_data: AssessmentScheduleUpdate,
    ) -> AssessmentSchedule | None:
        """Actualizează o evaluare periodică."""
        assessment = self.get_by_id(db, assessment_schedule_id)
        if not assessment:
            return None

        # Actualizează câmpurile
        if update_data.subject is not None:
            assessment.subject = update_data.subject
        if update_data.groups_composition is not None:
            assessment.groups_composition = update_data.groups_composition
        if update_data.professor_name is not None:
            assessment.professor_name = update_data.professor_name
        if update_data.assessment_date is not None:
            assessment.assessment_date = update_data.assessment_date
        if update_data.assessment_time is not None:
            assessment.assessment_time = update_data.assessment_time
        if update_data.room_code is not None:
            assessment.room_code = update_data.room_code
        if update_data.academic_year is not None:
            assessment.academic_year = update_data.academic_year
        if update_data.semester is not None:
            assessment.semester = update_data.semester
        if update_data.cycle_type is not None:
            assessment.cycle_type = update_data.cycle_type

        db.commit()
        db.refresh(assessment)
        return assessment

    def delete(self, db: Session, assessment_schedule_id: int) -> AssessmentSchedule | None:
        """Șterge o evaluare periodică."""
        assessment = self.get_by_id(db, assessment_schedule_id)
        if not assessment:
            return None

        db.delete(assessment)
        db.commit()
        return assessment
