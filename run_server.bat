@echo off
echo ========================================
echo   Student Schedule Management API
echo ========================================
echo.

cd server

echo [1/3] Verificare dependențe...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo ⚠️  FastAPI nu este instalat. Instalare dependențe...
    pip install -r requirements.txt
) else (
    echo ✓ Dependențe OK
)

echo.
echo [2/3] Inițializare baza de date...
python init_db.py
if errorlevel 1 (
    echo ❌ Eroare la inițializarea bazei de date!
    pause
    exit /b 1
)

echo.
echo [3/3] Pornire server...
echo.

REM ========================================
REM CONFIGURARE SMTP PENTRU EMAIL
REM ========================================
REM Decomentează și configurează următoarele linii pentru a activa notificările prin email:
REM
REM Pentru GMAIL:
REM set SMTP_HOST=smtp.gmail.com
REM set SMTP_PORT=587
REM set SMTP_USER=adresa-ta@gmail.com
REM set SMTP_PASSWORD=parola-de-aplicatie
REM set EMAIL_FROM=adresa-ta@gmail.com
REM
REM Pentru OUTLOOK/Office 365:
REM set SMTP_HOST=smtp.office365.com
REM set SMTP_PORT=587
REM set SMTP_USER=nume.prenume@domeniu.com
REM set SMTP_PASSWORD=parola-ta
REM set EMAIL_FROM=nume.prenume@domeniu.com
REM
REM Sau creează un fișier .env în folderul server/ cu aceste variabile
REM Pentru detalii: vezi CONFIGURARE_GMAIL.md sau CONFIGURARE_OUTLOOK.md
REM ========================================

echo 📖 Documentația API: http://127.0.0.1:8000/docs
echo 🔗 API disponibil la: http://127.0.0.1:8000
echo.
echo Apasă Ctrl+C pentru a opri serverul
echo.

uvicorn main:app --reload

pause

