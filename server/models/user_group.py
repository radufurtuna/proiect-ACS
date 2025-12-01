from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from core.database import Base


class UserGroup(Base):
    """Tabelă de asociere între utilizatori și grupe."""
    __tablename__ = "user_groups"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_groups_user_id"),  # Un utilizator poate avea o singură grupă
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)

    user = relationship("User", backref="user_group")
    group = relationship("Group")

