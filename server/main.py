from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Încarcă variabilele de mediu din fișierul .env
load_dotenv()

from routers import (
    auth_router,
    group_router,
    orar_router,
    professor_router,
    room_router,
    schedule_notifications,
    subject_router,
    user_router,
    websocket_router,
)

app = FastAPI(
    title="Student Schedule Management API",
    description="API pentru managementul orarului studenților cu autentificare și roluri",
    version="1.0.0"
)

# CORS origins - permite ambele clienți (student și admin)
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routerele
app.include_router(auth_router.router)
app.include_router(group_router.router)
app.include_router(professor_router.router)
app.include_router(subject_router.router)
app.include_router(room_router.router)
app.include_router(orar_router.router)
app.include_router(schedule_notifications.router)
app.include_router(user_router.router)
app.include_router(websocket_router.router)


@app.get("/")
def home():
    """Endpoint principal pentru verificarea statusului serverului."""
    return {
        "message": "FastAPI server is running successfully!",
        "docs": "/docs",
        "version": "1.0.0"
    }
