from sqlalchemy.orm import Session

from models.group import Group
from schemas.reference import GroupCreate, GroupUpdate


class GroupRepository:
    def get_all(self, db: Session):
        return db.query(Group).order_by(Group.code).all()

    def get_by_id(self, db: Session, group_id: int):
        return db.query(Group).filter(Group.id == group_id).first()

    def create(self, db: Session, data: GroupCreate):
        group = Group(
            code=data.code,
            year=data.year,
            faculty=data.faculty,
            specialization=data.specialization,
        )
        db.add(group)
        db.commit()
        db.refresh(group)
        return group

    def update(self, db: Session, group_id: int, data: GroupUpdate):
        group = self.get_by_id(db, group_id)
        if not group:
            return None

        if data.code is not None:
            group.code = data.code
        if data.year is not None:
            group.year = data.year
        if data.faculty is not None:
            group.faculty = data.faculty
        if data.specialization is not None:
            group.specialization = data.specialization

        db.commit()
        db.refresh(group)
        return group

    def delete(self, db: Session, group_id: int):
        group = self.get_by_id(db, group_id)
        if not group:
            return None
        db.delete(group)
        db.commit()
        return group

