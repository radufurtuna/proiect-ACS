"""
Module pentru securitate: hash-uri de parole, JWT tokens, etc.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

# Configurare pentru hash-ul parolelor
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Configurare pentru JWT
SECRET_KEY = "your-secret-key-change-in-production"  # TODO: Mută într-un fișier .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # Token-ul expiră după 24 de ore (1440 minute)


def get_password_hash(password: str) -> str:
    """Generează hash pentru o parolă."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    """
    Verifică dacă parola plain text corespunde cu hash-ul.
    
    Args:
        plain_password: Parola în text clar
        hashed_password: Hash-ul parolei (poate fi None pentru utilizatori fără parolă)
    
    Returns:
        True dacă parola este corectă, False altfel
    """
    if hashed_password is None or not hashed_password.strip():
        return False
    
    try:
        # Încearcă să verifice parola
        return pwd_context.verify(plain_password, hashed_password)
    except UnknownHashError:
        # Hash-ul nu poate fi identificat (format invalid sau corupt)
        # Nu afișăm mesajul pentru fiecare încercare de login (prea mult spam)
        return False
    except Exception as e:
        # Altă eroare la verificare
        print(f"⚠️ Eroare la verificarea parolei: {str(e)}")
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creează un token JWT de acces.
    
    Args:
        data: Datele care vor fi incluse în token (de ex: {"sub": "username", "role": "admin"})
        expires_delta: Timpul până la expirarea token-ului (opțional)
    
    Returns:
        Token-ul JWT ca string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodează și verifică un token JWT.
    
    Args:
        token: Token-ul JWT de decodat
    
    Returns:
        Payload-ul token-ului decodat (dict cu datele)
    
    Raises:
        ValueError: Dacă token-ul este invalid sau a expirat
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token-ul a expirat")
    except jwt.InvalidTokenError:
        raise ValueError("Token-ul este invalid")

