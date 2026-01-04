from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os

# Suportă atât SQLite cât și PostgreSQL prin variabila de mediu DATABASE_URL
# Format PostgreSQL: postgresql://user:password@host:port/database
# Format SQLite: sqlite:///./schedule.db
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./schedule.db")

# Configurare engine în funcție de tipul de bază de date
if DATABASE_URL.startswith("postgresql"):
    # PostgreSQL - folosește pool de conexiuni pentru performanță
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Verifică conexiunile înainte de utilizare
    )
else:
    # SQLite - păstrează compatibilitatea cu configurația existentă
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )

# Session manager – handles database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all SQLAlchemy models
class Base(DeclarativeBase):
    pass
