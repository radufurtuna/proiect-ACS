# 📚 Student Schedule Management System

Aplicație full-stack pentru managementul orarului studenților cu autentificare și roluri.

## 🏗️ Arhitectură

- **Backend**: FastAPI (Python) cu SQLite
- **Frontend**: Next.js 16 cu React 19 și TypeScript
- **Autentificare**: JWT (JSON Web Tokens)
- **Baza de date**: SQLite cu SQLAlchemy ORM

## 📋 Cerințe

### Backend
- Python 3.11+
- pip

### Frontend
- Node.js 18+
- npm

## 🚀 Instalare și Rulare

### Opțiunea 0: Docker Compose (Recomandat pentru producție)

Cel mai simplu mod de a rula aplicația este folosind Docker Compose:

```bash
# Construiește și pornește containerele
docker-compose up -d --build

# Verifică statusul
docker-compose ps

# Vezi log-urile
docker-compose logs -f

# Oprește containerele
docker-compose down
```

Aplicația va fi disponibilă la:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentație API**: http://localhost:8000/docs

Pentru detalii complete, vezi [DOCKER.md](./DOCKER.md)

### 1. Backend (FastAPI) - Instalare manuală

#### Opțiunea A: Scripturi batch (Windows)
```bash
init_db.bat      # Inițializează baza de date (prima dată)
run_server.bat   # Pornește serverul
```

#### Opțiunea B: Manual
```bash
cd server
pip install -r requirements.txt
python init_db.py
uvicorn main:app --reload
```

Serverul va rula pe **http://127.0.0.1:8000**

### 2. Frontend (Next.js)

```bash
cd client
npm install
npm run dev
```

Aplicația va rula pe **http://localhost:3000**

## 🔐 Autentificare

### Utilizatori de test
- **Admin**: `admin` / `admin123`
- **Student**: `student` / `student123`

### Flux de autentificare
1. Utilizatorul introduce username și parolă
2. Sistemul verifică credențialele în baza de date
3. Returnează JWT token cu rolul utilizatorului
4. Redirecționare automată:
   - **Admin** → `/admin/dashboard` (management complet)
   - **Student** → `/student/schedule` (doar vizualizare)
5. **Vizitatori**: pot accesa direct `/student/schedule` fără autentificare (orar public)
6. Pagina de login afișează un buton „Vizualizează orarul fără autentificare” chiar sub formular

## 📝 Endpoint-uri API

### Autentificare
- `POST /auth/register` - Înregistrare utilizator nou (doar admin)
- `POST /auth/login` - Autentificare (returnează JWT token + rol)

### Orar (Necesită autentificare)
- `GET /schedule/` - Obține toate orarele
- `GET /schedule/{group}` - Obține orarul pentru un grup
- `GET /schedule/id/{id}` - Obține un orar după ID

### Orar - Doar Admin
- `POST /schedule/` - Adaugă curs nou
- `PUT /schedule/{id}` - Actualizează curs
- `DELETE /schedule/{id}` - Șterge curs

## 📖 Documentație API

După ce pornești serverul, accesează:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## 🎯 Funcționalități

### Interfață Administrator
- Vizualizare orar complet
- Adăugare cursuri noi
- Editare cursuri existente
- Ștergere cursuri
- Filtrare după grup

### Interfață Student
- Vizualizare orar (doar citire)
- Filtrare după grup
- Fără posibilitate de modificare

## 📁 Structura Proiectului

```
proiect ACS/
├── server/              # Backend FastAPI
│   ├── core/           # Configurații și utilitare
│   ├── models/         # Modele SQLAlchemy
│   ├── repositories/   # Pattern Repository
│   ├── routers/        # Endpoint-uri API
│   ├── schemas/        # Pydantic schemas
│   ├── alembic/        # Migrări baza de date
│   ├── main.py         # Aplicația principală
│   └── init_db.py      # Inițializare baza de date
├── client/             # Frontend Next.js
│   ├── app/           # App Router (Next.js)
│   │   ├── admin/     # Dashboard administrator
│   │   ├── student/   # Interfață student
│   │   └── login/     # Pagina de autentificare
│   ├── lib/           # Servicii API
│   └── types/         # TypeScript types
├── init_db.bat        # Script inițializare baza de date
└── run_server.bat     # Script pornire server
```

## 🔒 Securitate

- Parole hash-uite cu Argon2
- JWT tokens pentru autentificare
- Roluri în baza de date (admin/student)
- Protecție endpoint-uri pe baza de rol
- CORS configurat pentru frontend

## ⚠️ Note Importante

- Baza de date SQLite se creează automat în `server/schedule.db`
- Rolurile utilizatorilor sunt setate în baza de date (nu pot fi alese la înregistrare)
- Doar administratorii pot crea utilizatori noi prin `/auth/register`
- Token-ul JWT expiră după 30 minute

"# proiect-ACS" 
