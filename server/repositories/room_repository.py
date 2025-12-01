from sqlalchemy.orm import Session

from models.room import Room
from schemas.reference import RoomCreate, RoomUpdate


class RoomRepository:
    def get_all(self, db: Session):
        return db.query(Room).order_by(Room.code).all()

    def get_by_id(self, db: Session, room_id: int):
        return db.query(Room).filter(Room.id == room_id).first()

    def create(self, db: Session, data: RoomCreate):
        room = Room(
            code=data.code,
            building=data.building,
            capacity=data.capacity,
        )
        db.add(room)
        db.commit()
        db.refresh(room)
        return room

    def update(self, db: Session, room_id: int, data: RoomUpdate):
        room = self.get_by_id(db, room_id)
        if not room:
            return None

        if data.code is not None:
            room.code = data.code
        if data.building is not None:
            room.building = data.building
        if data.capacity is not None:
            room.capacity = data.capacity

        db.commit()
        db.refresh(room)
        return room

    def delete(self, db: Session, room_id: int):
        room = self.get_by_id(db, room_id)
        if not room:
            return None
        db.delete(room)
        db.commit()
        return room

