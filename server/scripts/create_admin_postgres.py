"""
Script pentru crearea unui utilizator admin în PostgreSQL.
Folosește DATABASE_URL din variabila de mediu.
"""
import os
import sys
from core.database import SessionLocal
from core.security import get_password_hash
from models.user import User, UserRole
from repositories.user_repository import UserRepository

def create_admin(email: str, password: str):
    """Creează un utilizator admin în baza de date."""
    db = SessionLocal()
    user_repo = UserRepository()
    
    try:
        # Verifică dacă utilizatorul există deja
        existing_user = user_repo.get_by_username(db, email.lower())
        if existing_user:
            print(f"❌ Utilizatorul '{email}' există deja!")
            return False
        
        # Creează utilizatorul admin
        hashed_password = get_password_hash(password)
        new_user = User(
            username=email.lower(),
            password_hash=hashed_password,
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"✓ Utilizator admin creat cu succes!")
        print(f"  Email: {email}")
        print(f"  Rol: ADMIN")
        print(f"  ID: {new_user.id}")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Eroare la crearea utilizatorului: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Utilizare: python create_admin_postgres.py <email> <password>")
        print("Exemplu: python create_admin_postgres.py admin@example.com parola123")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    print(f"🔧 Creare utilizator admin în PostgreSQL...")
    print(f"📧 Email: {email}")
    print(f"🔗 DATABASE_URL: {os.getenv('DATABASE_URL', 'Nu este setat')}")
    print()
    
    success = create_admin(email, password)
    sys.exit(0 if success else 1)

