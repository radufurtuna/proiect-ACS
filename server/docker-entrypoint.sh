#!/bin/bash
set -e

echo " Pornire container server..."

# Setează DATABASE_URL pentru inițializare (suprascrie dacă nu e setat în env)
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL=sqlite:///./data/schedule.db
    # Creează directorul pentru baza de date SQLite dacă nu există
    mkdir -p /app/data
    echo " Director baza de date SQLite: /app/data"
else
    echo " Folosind baza de date configurată prin DATABASE_URL"
fi

echo " DATABASE_URL: $DATABASE_URL"

# Verifică tipul de bază de date
if [[ "$DATABASE_URL" == postgresql* ]]; then
    echo " Detectată bază de date PostgreSQL"
    echo " Așteptă conexiunea la PostgreSQL..."
    
    # Folosește Python pentru a verifica conexiunea (mai robust decât sed)
    MAX_ATTEMPTS=60
    ATTEMPT=0
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        # Verifică conexiunea folosind Python și SQLAlchemy
        if python -c "
import os
import sys
from sqlalchemy import create_engine, text
try:
    engine = create_engine(os.getenv('DATABASE_URL'))
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; then
            echo "✓ PostgreSQL este gata!"
            break
        fi
        ATTEMPT=$((ATTEMPT + 1))
        if [ $((ATTEMPT % 5)) -eq 0 ]; then
            echo " Aștept PostgreSQL... ($ATTEMPT/$MAX_ATTEMPTS)"
        fi
        sleep 1
    done
    
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo " Eroare: PostgreSQL nu este disponibil după $MAX_ATTEMPTS secunde"
        exit 1
    fi
else
    echo " Detectată bază de date SQLite"
    # Inițializează baza de date SQLite dacă nu există
    if [ ! -f "/app/data/schedule.db" ]; then
        echo " Inițializare baza de date SQLite..."
        cd /app
        python init_db.py
        echo "✓ Baza de date SQLite inițializată!"
    else
        echo "✓ Baza de date SQLite deja există, se continuă..."
    fi
fi

# Rulează migrările Alembic pentru a crea/actualiza schema
echo " Rulare migrări Alembic..."
cd /app
python -m alembic upgrade head || echo "  Atenție: Migrările Alembic au eșuat sau nu există migrări"

echo " Pornire server FastAPI..."
# Rulează comanda primită (uvicorn)
exec "$@"
