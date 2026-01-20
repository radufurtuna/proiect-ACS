from sqlalchemy.orm import Session

from models.user import User, UserRole
from models.user_group import UserGroup
from core.security import get_password_hash


class UserRepository:
    """Repository class responsible for all database operations related to users."""

    def list(self, db: Session):
        """Returnează toți utilizatorii cu grupele asociate."""
        return db.query(User).order_by(User.username).all()
    
    def get_user_group(self, db: Session, user_id: int):
        """Obține grupă asociată unui utilizator."""
        return db.query(UserGroup).filter(UserGroup.user_id == user_id).first()
    
    def set_user_group(self, db: Session, user_id: int, group_id: int | None):
        """Asociază sau elimină grupă pentru un utilizator."""
        existing = self.get_user_group(db, user_id)
        if group_id is None:
            # Șterge asocierea
            if existing:
                db.delete(existing)
                db.commit()
        else:
            # Creează sau actualizează asocierea
            if existing:
                existing.group_id = group_id
            else:
                new_association = UserGroup(user_id=user_id, group_id=group_id)
                db.add(new_association)
            db.commit()

    def get_by_username(self, db: Session, username: str):
        """Găsește un utilizator după username."""
        return db.query(User).filter(User.username == username).first()

    def get_by_id(self, db: Session, user_id: int):
        """Găsește un utilizator după ID."""
        return db.query(User).filter(User.id == user_id).first()

    def create(self, db: Session, username: str, password: str | None = None, role: str | UserRole | None = None):
        """
        Creează un nou utilizator.
        Dacă parola nu este furnizată, utilizatorul va fi creat ca neactiv (fără parolă).
        """
        # Verifică dacă username-ul există deja
        existing_user = self.get_by_username(db, username)
        if existing_user:
            return None

        hashed_password = None
        is_active = False
        
        if password:
            hashed_password = get_password_hash(password)
            is_active = True  # Utilizatorul are parolă, deci este activ

        # Dacă rolul nu este specificat, implicit este student
        if role is None:
            role = UserRole.STUDENT
        elif not isinstance(role, UserRole):
            role = UserRole(role)

        new_user = User(
            username=username.lower(),  # Normalizare email
            password_hash=hashed_password,
            role=role,
            is_active=is_active
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    
    def set_password(self, db: Session, user_id: int, password: str) -> bool:
        """
        Setează parola pentru un utilizator și îl marchează ca activ.
        """
        user = self.get_by_id(db, user_id)
        if not user:
            return False
        
        user.password_hash = get_password_hash(password)
        user.is_active = True
        db.commit()
        db.refresh(user)
        return True

    def update(self, db: Session, user_id: int, *, username: str | None = None,
               password: str | None = None, role: str | UserRole | None = None):
        """Actualizează un utilizator existent."""
        user = self.get_by_id(db, user_id)
        if not user:
            return None

        if username and username != user.username:
            if self.get_by_username(db, username):
                return None
            user.username = username
        if password:
            user.password_hash = get_password_hash(password)
        if role:
            user.role = role if isinstance(role, UserRole) else UserRole(role)

        db.commit()
        db.refresh(user)
        return user

    def delete(self, db: Session, user_id: int):
        """Șterge un utilizator și asocierea cu grupă (dacă există)."""
        try:
            user = self.get_by_id(db, user_id)
            if not user:
                return None
            
            # Șterge asocierea cu grupă înainte de a șterge utilizatorul
            user_group = self.get_user_group(db, user_id)
            if user_group:
                db.delete(user_group)
            
            # Șterge utilizatorul
            db.delete(user)
            db.commit()
            return user
        except Exception as e:
            db.rollback()
            print(f"Eroare la ștergerea utilizatorului {user_id}: {str(e)}")
            raise

