from pydantic import BaseModel, EmailStr


class GroupBase(BaseModel):
    code: str
    year: int | None = None
    faculty: str | None = None
    specialization: str | None = None


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    code: str | None = None
    year: int | None = None
    faculty: str | None = None
    specialization: str | None = None


class GroupResponse(GroupBase):
    id: int

    class Config:
        from_attributes = True


class ProfessorBase(BaseModel):
    full_name: str
    department: str | None = None
    email: EmailStr | None = None


class ProfessorCreate(ProfessorBase):
    pass


class ProfessorUpdate(BaseModel):
    full_name: str | None = None
    department: str | None = None
    email: EmailStr | None = None


class ProfessorResponse(ProfessorBase):
    id: int

    class Config:
        from_attributes = True


class SubjectBase(BaseModel):
    name: str
    code: str
    semester: str | None = None


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    semester: str | None = None


class SubjectResponse(SubjectBase):
    id: int

    class Config:
        from_attributes = True


class RoomBase(BaseModel):
    code: str
    building: str | None = None
    capacity: int | None = None


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    code: str | None = None
    building: str | None = None
    capacity: int | None = None


class RoomResponse(RoomBase):
    id: int

    class Config:
        from_attributes = True

