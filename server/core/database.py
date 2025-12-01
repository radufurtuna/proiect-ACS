from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os

# Create the local SQLite database (schedule.db)
# Suportă variabile de mediu pentru Docker
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./schedule.db")

# Database engine – establishes the connection to SQLite
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# Session manager – handles database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all SQLAlchemy models
class Base(DeclarativeBase):
    pass
