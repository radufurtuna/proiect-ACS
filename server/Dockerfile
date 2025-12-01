FROM python:3.12-slim

WORKDIR /app

# Instalează dependențele sistem
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Copiază requirements.txt și instalează dependențele Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiază codul aplicației
COPY . .

# Creează directorul pentru baza de date SQLite (va fi montat ca volum)
RUN mkdir -p /app/data

# Expune portul
EXPOSE 8000

# Script de start care inițializează DB dacă nu există
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["uvicorn", "main:app", "--port", "8000"]
