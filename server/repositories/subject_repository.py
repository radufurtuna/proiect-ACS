from sqlalchemy.orm import Session

from models.subject import Subject
from schemas.reference import SubjectCreate, SubjectUpdate


class SubjectRepository:
    def get_all(self, db: Session):
        return db.query(Subject).order_by(Subject.name).all()

    def get_by_id(self, db: Session, subject_id: int):
        return db.query(Subject).filter(Subject.id == subject_id).first()

    def create(self, db: Session, data: SubjectCreate):
        subject = Subject(
            name=data.name,
            code=data.code,
            semester=data.semester,
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)
        return subject

    def update(self, db: Session, subject_id: int, data: SubjectUpdate):
        subject = self.get_by_id(db, subject_id)
        if not subject:
            return None

        if data.name is not None:
            subject.name = data.name
        if data.code is not None:
            subject.code = data.code
        if data.semester is not None:
            subject.semester = data.semester

        db.commit()
        db.refresh(subject)
        return subject

    def delete(self, db: Session, subject_id: int):
        subject = self.get_by_id(db, subject_id)
        if not subject:
            return None
        db.delete(subject)
        db.commit()
        return subject

