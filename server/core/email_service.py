"""
Serviciu pentru trimiterea de email-uri de notificare.
Folosește SMTP pentru trimiterea email-urilor.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Încarcă variabilele de mediu din fișierul .env (dacă există)
# Caută fișierul .env în directorul server/ (unde este acest fișier)
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"✓ Fișier .env încărcat din: {env_path}")
else:
    # Încearcă să încarce din directorul curent și din părinte
    load_dotenv()
    current_dir_env = Path('.env')
    if current_dir_env.exists():
        load_dotenv(dotenv_path=current_dir_env)
        print(f"✓ Fișier .env încărcat din: {current_dir_env.absolute()}")
    else:
        print(f"⚠️ Fișier .env nu a fost găsit. Folosesc variabilele de mediu din sistem.")

# Configurare SMTP (poate fi setată prin variabile de mediu sau config)
# Suportă: Gmail, Outlook/Office 365, sau alte servere SMTP
SMTP_HOST = os.getenv("SMTP_HOST")  # Ex: smtp.gmail.com sau smtp.office365.com
SMTP_PORT = os.getenv("SMTP_PORT")  # Port pentru TLS (587) sau SSL (465)
SMTP_USER = os.getenv("SMTP_USER")  # Email-ul de la care se trimit notificările
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # Parola sau parolă de aplicație
EMAIL_FROM = os.getenv("EMAIL_FROM") or SMTP_USER

def send_schedule_notification_email(
    recipient_email: str,
    group_code: str,
    subject: str = "Notificare - Modificare Orar"
) -> bool:
    """
    Trimite un email de notificare către un student când orarul grupei sale este modificat.
    
    Args:
        recipient_email: Email-ul studentului (posta corporativă)
        group_code: Codul grupei pentru care s-a modificat orarul
        subject: Subiectul email-ului
    
    Returns:
        True dacă email-ul a fost trimis cu succes, False altfel
    """
    try:
        # Verifică dacă sunt configurate credențialele SMTP
        if not SMTP_HOST or not SMTP_PORT or not SMTP_USER or not SMTP_PASSWORD:
            print(f"⚠️ SMTP nu este configurat complet.")
            print(f"⚠️ SMTP_HOST: {SMTP_HOST}")
            print(f"⚠️ SMTP_PORT: {SMTP_PORT}")
            print(f"⚠️ SMTP_USER: {'Setat' if SMTP_USER else 'Nesetat'}")
            print(f"⚠️ SMTP_PASSWORD: {'Setat' if SMTP_PASSWORD else 'Nesetat'}")
            print(f"⚠️ Email-ul către {recipient_email} nu a fost trimis.")
            print("⚠️ Configurează variabilele de mediu SMTP în fișierul .env sau în run_server.bat")
            return False
        
        # Creează mesajul
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = EMAIL_FROM
        message["To"] = recipient_email
        # Adaugă headers importante pentru a evita spam
        message["Reply-To"] = EMAIL_FROM
        message["X-Mailer"] = "Schedule Management System"
        message["X-Priority"] = "3"
        message["Importance"] = "Normal"
        
        # Conținutul email-ului în text simplu
        text_content = f"""
Bună ziua,

Vă informăm că orarul pentru grupă {group_code} a fost modificat.

Vă rugăm să verificați orarul actualizat în sistem.

Cu respect,
Sistemul de Management al Orarului
        """.strip()
        
        # Conținutul email-ului în HTML
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Notificare Orar</h1>
        </div>
        <div class="content">
            <p>Bună ziua,</p>
            <p>Vă informăm că <strong>orarul pentru grupă <span class="group-code">{group_code}</span> a fost modificat</strong>.</p>
            <p>Vă rugăm să verificați orarul actualizat în sistem.</p>
            <p>Cu respect,<br>Sistemul de Management al Orarului</p>
        </div>
        <div class="footer">
            <p>Acesta este un mesaj automat. Vă rugăm să nu răspundeți la acest email.</p>
        </div>
    </div>
</body>
</html>
        """.strip()
        
        # Adaugă conținutul la mesaj
        part1 = MIMEText(text_content, "plain", "utf-8")
        part2 = MIMEText(html_content, "html", "utf-8")
        
        message.attach(part1)
        message.attach(part2)
        
        # Trimite email-ul
        smtp_port = int(SMTP_PORT) if SMTP_PORT else 587

        
        with smtplib.SMTP(SMTP_HOST, smtp_port, timeout=30) as server:
            # Activează debug logging pentru a vedea ce se întâmplă
            server.set_debuglevel(0)  # Poți seta la 1 pentru debug detaliat
            
            # Conectare și autentificare
            server.starttls()  # Activează criptarea TLS

            
            server.login(SMTP_USER, SMTP_PASSWORD)

            
            # Trimite email-ul
            server.send_message(message)

        

        return True
        
    except smtplib.SMTPAuthenticationError as e:
        error_code = e.smtp_code if hasattr(e, 'smtp_code') else 'Unknown'
        error_msg = str(e.smtp_error) if hasattr(e, 'smtp_error') else str(e)
        
        if '535' in str(e) or 'Authentication unsuccessful' in str(e) or 'incorrect' in str(e).lower():
            print(f"✗ EROARE AUTENTIFICARE pentru {SMTP_USER}:")
            print(f"  Cod eroare: {error_code}")
            print(f"  Mesaj: {error_msg}")
            print(f"")
            print(f"  🔧 SOLUȚII POSIBILE:")
            print(f"  1. Verifică că parola este corectă")
            print(f"  2. Dacă ai autentificare în doi pași (2FA), folosește o 'Parolă de aplicație':")
            if "gmail.com" in (SMTP_HOST or "").lower():
                print(f"     → Gmail: https://myaccount.google.com/apppasswords")
            else:
                print(f"     → Outlook: https://account.microsoft.com/security/app-passwords")
                print(f"     → Gmail: https://myaccount.google.com/apppasswords")
            print(f"  3. Verifică că contul permite acces SMTP")
            print(f"  4. Contactează administratorul IT pentru aprobare (conturi corporative)")
            print(f"")
        else:
            print(f"✗ Eroare autentificare SMTP: {str(e)}")
        print(f"  Email-ul către {recipient_email} nu a fost trimis.")
        return False
        
    except smtplib.SMTPRecipientsRefused as e:
        print(f"✗ EROARE: Destinatar refuzat pentru {recipient_email}")
        print(f"  Detalii: {str(e)}")
        print(f"  Posibile cauze:")
        print(f"    - Adresa email nu există sau este invalidă")
        print(f"    - Serverul destinatar a refuzat email-ul")
        return False
        
    except smtplib.SMTPSenderRefused as e:
        print(f"✗ EROARE: Expeditor refuzat ({EMAIL_FROM})")
        print(f"  Cod eroare: {e.smtp_code}")
        print(f"  Mesaj: {e.smtp_error}")
        print(f"  Posibile cauze:")
        print(f"    - Contul Gmail/Outlook nu permite trimiterea")
        print(f"    - Adresa FROM nu este validată")
        return False
        
    except smtplib.SMTPDataError as e:
        print(f"✗ EROARE: Serverul a refuzat datele email-ului")
        print(f"  Cod eroare: {e.smtp_code}")
        print(f"  Mesaj: {e.smtp_error}")
        print(f"  Posibile cauze:")
        print(f"    - Email-ul este prea mare")
        print(f"    - Serverul consideră email-ul spam")
        return False
        
    except smtplib.SMTPConnectError as e:
        print(f"✗ EROARE: Nu s-a putut conecta la serverul SMTP")
        print(f"  Server: {SMTP_HOST}:{SMTP_PORT}")
        print(f"  Detalii: {str(e)}")
        print(f"  Posibile cauze:")
        print(f"    - Serverul SMTP este inaccesibil")
        print(f"    - Portul este blocat de firewall")
        return False
        
    except smtplib.SMTPException as e:
        print(f"✗ EROARE SMTP la trimiterea email-ului către {recipient_email}: {str(e)}")
        print(f"  Tip eroare: {type(e).__name__}")
        if hasattr(e, 'smtp_code'):
            print(f"  Cod SMTP: {e.smtp_code}")
        if hasattr(e, 'smtp_error'):
            print(f"  Eroare SMTP: {e.smtp_error}")
        return False
        
    except Exception as e:
        print(f"✗ EROARE NEAȘTEPTATĂ la trimiterea email-ului către {recipient_email}: {str(e)}")
        print(f"  Tip eroare: {type(e).__name__}")
        import traceback
        print(f"  Traceback:")
        traceback.print_exc()
        return False


def send_schedule_notifications_to_students(
    student_emails: List[str],
    group_code: str
) -> dict:
    """
    Trimite notificări către mai mulți studenți despre modificarea orarului.
    
    Args:
        student_emails: Lista de email-uri ale studenților
        group_code: Codul grupei pentru care s-a modificat orarul
    
    Returns:
        Dict cu statistici despre trimiterea email-urilor
    """
    import time
    
    results = {
        "total": len(student_emails),
        "sent": 0,
        "failed": 0,
        "errors": []
    }
    


    for i, email in enumerate(student_emails, 1):
        print(f"[{i}/{len(student_emails)}] Procesare {email}...")

        if send_schedule_notification_email(email, group_code):
            results["sent"] += 1
        else:
            results["failed"] += 1
            results["errors"].append(email)

        # Adaugă un mic delay între trimiteri pentru a evita rate limiting
        # Gmail permite maxim ~100 email-uri/zi pentru conturi gratuite fără verificare
        # Delay-ul ajută să nu fie blocat ca spam
        if i < len(student_emails):  # Nu aștepta după ultimul email
            time.sleep(0.5)  # 0.5 secunde între email-uri



    if results["errors"]:
        print(f"  ❌ Email-uri care au eșuat: {', '.join(results['errors'][:5])}")
        if len(results["errors"]) > 5:
            print(f"     ... și {len(results['errors']) - 5} altele")
    
    return results


def send_verification_code_email(
    recipient_email: str,
    code: str,
    subject: str = "Cod de verificare - Setare parolă"
) -> bool:
    """
    Trimite un email cu codul de verificare pentru setarea parolei.
    
    Args:
        recipient_email: Email-ul utilizatorului
        code: Codul de verificare de 6 cifre
        subject: Subiectul email-ului
    
    Returns:
        True dacă email-ul a fost trimis cu succes, False altfel
    """
    try:
        # Verifică dacă sunt configurate credențialele SMTP
        if not SMTP_HOST or not SMTP_PORT or not SMTP_USER or not SMTP_PASSWORD:
            print(f"⚠️ SMTP nu este configurat complet. Codul de verificare nu poate fi trimis către {recipient_email}.")
            return False
        
        # Creează mesajul
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = EMAIL_FROM
        message["To"] = recipient_email
        message["Reply-To"] = EMAIL_FROM
        message["X-Mailer"] = "Schedule Management System"
        
        # Conținutul email-ului în text simplu
        text_content = f"""
Bună ziua,

Codul dvs. de verificare pentru setarea parolei este:

{code}

Acest cod este valabil 10 minute.

Dacă nu ați solicitat acest cod, vă rugăm să ignorați acest email.

Cu respect,
Sistemul de Management al Orarului
        """.strip()
        
        # Conținutul email-ului în HTML
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            background-color: #3b82f6;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
        }}
        .content {{
            padding: 30px 20px;
        }}
        .code-box {{
            background-color: #f0f0f0;
            border: 2px dashed #3b82f6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }}
        .code {{
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
            letter-spacing: 5px;
            font-family: 'Courier New', monospace;
        }}
        .footer {{
            background-color: #f9f9f9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Cod de Verificare</h1>
        </div>
        <div class="content">
            <p>Bună ziua,</p>
            <p>Codul dvs. de verificare pentru setarea parolei este:</p>
            <div class="code-box">
                <div class="code">{code}</div>
            </div>
            <p>Acest cod este valabil <strong>10 minute</strong>.</p>
            <p><em>Dacă nu ați solicitat acest cod, vă rugăm să ignorați acest email.</em></p>
            <p>Cu respect,<br>Sistemul de Management al Orarului</p>
        </div>
        <div class="footer">
            <p>Acesta este un mesaj automat. Vă rugăm să nu răspundeți la acest email.</p>
        </div>
    </div>
</body>
</html>
        """.strip()
        
        # Adaugă conținutul la mesaj
        part1 = MIMEText(text_content, "plain", "utf-8")
        part2 = MIMEText(html_content, "html", "utf-8")
        
        message.attach(part1)
        message.attach(part2)
        
        # Trimite email-ul
        smtp_port = int(SMTP_PORT) if SMTP_PORT else 587
        
        with smtplib.SMTP(SMTP_HOST, smtp_port, timeout=30) as server:
            server.set_debuglevel(0)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)
        
        print(f"✓ Cod de verificare trimis cu succes către {recipient_email}")
        return True
        
    except Exception as e:
        print(f"✗ Eroare la trimiterea codului de verificare către {recipient_email}: {str(e)}")
        return False

