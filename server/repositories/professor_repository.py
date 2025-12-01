from sqlalchemy.orm import Session

from models.professor import Professor
from schemas.reference import ProfessorCreate, ProfessorUpdate


class ProfessorRepository:
    def get_all(self, db: Session):
        return db.query(Professor).order_by(Professor.full_name).all()

    def get_by_id(self, db: Session, professor_id: int):
        return db.query(Professor).filter(Professor.id == professor_id).first()

    def create(self, db: Session, data: ProfessorCreate):
        professor = Professor(
            full_name=data.full_name,
            department=data.department,
            email=data.email,
        )
        db.add(professor)
        db.commit()
        db.refresh(professor)
        return professor

    def update(self, db: Session, professor_id: int, data: ProfessorUpdate):
        professor = self.get_by_id(db, professor_id)
        if not professor:
            return None

        if data.full_name is not None:
            professor.full_name = data.full_name
        if data.department is not None:
            professor.department = data.department
        if data.email is not None:
            professor.email = data.email

        db.commit()
        db.refresh(professor)
        return professor

    def delete(self, db: Session, professor_id: int):
        professor = self.get_by_id(db, professor_id)
        if not professor:
            return None
        db.delete(professor)
        db.commit()
        return professor

