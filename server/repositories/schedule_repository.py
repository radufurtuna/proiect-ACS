from sqlalchemy.orm import Session, selectinload

from models.group import Group
from models.professor import Professor
from models.room import Room
from models.schedule import Schedule
from models.subject import Subject
from schemas.schedules import ScheduleCreate, ScheduleUpdate


class ScheduleRepository:
    """Repository class responsible for all database operations related to schedules."""

    def _base_query(self, db: Session):
        """
        Query de bază care folosește INNER JOIN pentru a filtra schedule-urile
        cu relații invalide (orphaned foreign keys).
        Acest lucru asigură că doar schedule-urile cu toate relațiile valide sunt returnate.
        """
        return (
            db.query(Schedule)
            .join(Group, Schedule.group_id == Group.id)  # Filtrează schedule-urile cu group_id invalid
            .join(Subject, Schedule.subject_id == Subject.id)  # Filtrează schedule-urile cu subject_id invalid
            .join(Professor, Schedule.professor_id == Professor.id)  # Filtrează schedule-urile cu professor_id invalid
            .join(Room, Schedule.room_id == Room.id)  # Filtrează schedule-urile cu room_id invalid
            .options(
                selectinload(Schedule.group),
                selectinload(Schedule.subject),
                selectinload(Schedule.professor),
                selectinload(Schedule.room),
                selectinload(Schedule.odd_week_subject),
                selectinload(Schedule.odd_week_professor),
                selectinload(Schedule.odd_week_room),
            )
        )

    def get_all(self, db: Session, academic_year: int | None = None, semester: str | None = None, cycle_type: str | None = None):
        """
        Obține toate schedule-urile, opțional filtrate după an academic, semestru și tip de ciclu.
        """
        query = self._base_query(db)
        
        # Aplică filtrele doar dacă sunt specificate
        if academic_year is not None:
            query = query.filter(Schedule.academic_year == academic_year)
        if semester is not None:
            query = query.filter(Schedule.semester == semester)
        if cycle_type is not None:
            query = query.filter(Schedule.cycle_type == cycle_type)
        
        return query.order_by(Schedule.day, Schedule.hour).all()

    def get_by_group_code(self, db: Session, group_code: str):
        """
        Obține toate schedule-urile pentru un grup după codul său.
        Group este deja inclus în _base_query prin JOIN, deci nu este nevoie de un JOIN suplimentar.
        """
        return (
            self._base_query(db)
            .filter(Group.code == group_code)
            .all()
        )

    def get_by_id(self, db: Session, schedule_id: int):
        return self._base_query(db).filter(Schedule.id == schedule_id).first()

    def create(self, db: Session, schedule_data: ScheduleCreate):
        new_schedule = Schedule(
            group_id=schedule_data.group_id,
            subject_id=schedule_data.subject_id,
            professor_id=schedule_data.professor_id,
            room_id=schedule_data.room_id,
            day=schedule_data.day,
            hour=schedule_data.hour,
            session_type=schedule_data.session_type,
            status=schedule_data.status,
            notes=schedule_data.notes,
            odd_week_subject_id=schedule_data.odd_week_subject_id,
            odd_week_professor_id=schedule_data.odd_week_professor_id,
            odd_week_room_id=schedule_data.odd_week_room_id,
            academic_year=schedule_data.academic_year,
            semester=schedule_data.semester,
            cycle_type=schedule_data.cycle_type,
        )
        db.add(new_schedule)
        db.commit()
        db.refresh(new_schedule)
        # Reinteroghează cu relațiile încărcate
        return self.get_by_id(db, new_schedule.id)

    def update(self, db: Session, schedule_id: int, update_data: ScheduleUpdate):
        schedule = self.get_by_id(db, schedule_id)
        if not schedule:
            return None

        if update_data.group_id is not None:
            schedule.group_id = update_data.group_id
        if update_data.subject_id is not None:
            schedule.subject_id = update_data.subject_id
        if update_data.professor_id is not None:
            schedule.professor_id = update_data.professor_id
        if update_data.room_id is not None:
            schedule.room_id = update_data.room_id
        if update_data.day is not None:
            schedule.day = update_data.day
        if update_data.hour is not None:
            schedule.hour = update_data.hour
        if update_data.session_type is not None:
            schedule.session_type = update_data.session_type
        if update_data.status is not None:
            schedule.status = update_data.status
        if update_data.notes is not None:
            schedule.notes = update_data.notes
        if update_data.odd_week_subject_id is not None:
            schedule.odd_week_subject_id = update_data.odd_week_subject_id
        if update_data.odd_week_professor_id is not None:
            schedule.odd_week_professor_id = update_data.odd_week_professor_id
        if update_data.odd_week_room_id is not None:
            schedule.odd_week_room_id = update_data.odd_week_room_id
        if update_data.academic_year is not None:
            schedule.academic_year = update_data.academic_year
        if update_data.semester is not None:
            schedule.semester = update_data.semester
        if update_data.cycle_type is not None:
            schedule.cycle_type = update_data.cycle_type

        schedule.version += 1

        db.commit()
        db.refresh(schedule)
        # Reinteroghează cu relațiile încărcate
        return self.get_by_id(db, schedule_id)

    def delete(self, db: Session, schedule_id: int):
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            return None

        db.delete(schedule)
        db.commit()
        return schedule
