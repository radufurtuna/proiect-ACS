#!/bin/bash
set -e

echo "🚀 Pornire container server..."

# Creează directorul pentru baza de date dacă nu există
mkdir -p /app/data

# Setează DATABASE_URL pentru inițializare (suprascrie dacă nu e setat în env)
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL=sqlite:///./data/schedule.db
fi

echo "📁 Director baza de date: /app/data"
echo "🔗 DATABASE_URL: $DATABASE_URL"

# Inițializează baza de date dacă nu există
if [ ! -f "/app/data/schedule.db" ]; then
    echo "📦 Inițializare baza de date..."
    cd /app
    python init_db.py
    echo "✓ Baza de date inițializată!"
else
    echo "✓ Baza de date deja există, se continuă..."
fi

echo "🌐 Pornire server FastAPI..."
# Rulează comanda primită (uvicorn)
exec "$@"
