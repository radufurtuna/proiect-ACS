# Configurare Email Notifications

Acest document explică cum să configurezi trimiterea de email-uri de notificare către studenți când orarul este modificat.

## Configurare SMTP

Sistemul folosește SMTP pentru trimiterea de email-uri. Trebuie să configurezi următoarele variabile de mediu:

### Variabile de Mediu

1. **SMTP_HOST** - Server-ul SMTP (ex: `smtp.gmail.com`)
2. **SMTP_PORT** - Portul SMTP (ex: `587` pentru TLS)
3. **SMTP_USER** - Email-ul de la care se trimit notificările
4. **SMTP_PASSWORD** - Parola pentru contul de email
5. **EMAIL_FROM** - Adresa "De la" pentru email-uri (opțional, implicit folosește SMTP_USER)

### Exemplu: Gmail

Pentru Gmail, trebuie să:

1. **Activezi "Verificarea în doi pași"** în contul Google (dacă nu este deja activată):
   - Accesează: https://myaccount.google.com/security
   - Activează "Verificarea în doi pași"

2. **Generezi o parolă de aplicație:**
   - Accesează: https://myaccount.google.com/apppasswords
   - Alege aplicația: "Mail"
   - Alege dispozitivul: "Alt (Nume personalizat)" → scrie "Schedule System"
   - Click "Generare"
   - **Copiază parola generată** (format: `abcd efgh ijkl mnop`)
     - ⚠️ **IMPORTANT:** O vei vedea o singură dată! Noteaz-o imediat!

3. **Folosești parola de aplicație** (NU parola normală de Gmail)

**Setări SMTP:**
- **SMTP_HOST**: `smtp.gmail.com`
- **SMTP_PORT**: `587` (TLS - recomandat) sau `465` (SSL)
- **SMTP_USER**: Adresa ta de email Gmail
- **SMTP_PASSWORD**: **Parolă de aplicație** (NU parola normală!)
- **EMAIL_FROM**: La fel ca SMTP_USER

**În Windows (CMD):**
```batch
set SMTP_HOST=smtp.gmail.com
set SMTP_PORT=587
set SMTP_USER=adresa-ta@gmail.com
set SMTP_PASSWORD=abcd-efgh-ijkl-mnop
set EMAIL_FROM=adresa-ta@gmail.com
```

**În Linux/Mac:**
```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASSWORD=your-app-password
export EMAIL_FROM=your-email@gmail.com
```

**Note importante pentru Gmail:**
- **Trebuie să folosești parolă de aplicație** - parola normală nu va funcționa
- Parola de aplicație poate conține spații - le poți elimina sau păstra
- Gmail are limite de trimitere: ~500 email-uri/zi pentru conturi gratuite
- Pentru detalii complete, vezi: `CONFIGURARE_GMAIL.md`

### Exemplu: Outlook/Office 365 (Posta Corporativă)

Pentru conturile Outlook/Office 365 corporative (posta corporativă):

**Setări SMTP:**
- **SMTP_HOST**: `smtp.office365.com`
- **SMTP_PORT**: `587` (TLS)
- **SMTP_USER**: Adresa ta de email corporativă (ex: `nume.prenume@domeniu.com`)
- **SMTP_PASSWORD**: Parola ta de email corporativă
- **EMAIL_FROM**: La fel ca SMTP_USER

**În Windows (CMD):**
```batch
set SMTP_HOST=smtp.office365.com
set SMTP_PORT=587
set SMTP_USER=nume.prenume@domeniu.com
set SMTP_PASSWORD=parola-ta
set EMAIL_FROM=nume.prenume@domeniu.com
```

**În Linux/Mac:**
```bash
export SMTP_HOST=smtp.office365.com
export SMTP_PORT=587
export SMTP_USER=nume.prenume@domeniu.com
export SMTP_PASSWORD=parola-ta
export EMAIL_FROM=nume.prenume@domeniu.com
```

**Note importante pentru Outlook/Office 365:**
- Folosește portul **587** cu TLS (starttls)
- Dacă contul are autentificare în doi pași activată, poate fi necesar să generezi o "Parolă de aplicație"
- Pentru conturi corporative, poate fi necesară aprobarea administratorului IT
- Verifică dacă contul permite "Aplicații mai puțin sigure" sau configurarea pentru SMTP

### Exemplu: Server SMTP local/corporat

```bash
export SMTP_HOST=smtp.yourcompany.com
export SMTP_PORT=587
export SMTP_USER=noreply@yourcompany.com
export SMTP_PASSWORD=your-password
export EMAIL_FROM=noreply@yourcompany.com
```

## Configurare în Windows (Batch)

### Opțiunea 1: Direct în `run_server.bat`

Deschide `run_server.bat` și adaugă variabilele de mediu înainte de linia `uvicorn main:app --reload`:

**Pentru Gmail:**
```batch
@echo off
cd server

REM Configurare SMTP pentru Gmail
set SMTP_HOST=smtp.gmail.com
set SMTP_PORT=587
set SMTP_USER=adresa-ta@gmail.com
set SMTP_PASSWORD=parola-de-aplicatie
set EMAIL_FROM=adresa-ta@gmail.com

REM Restul scriptului...
uvicorn main:app --reload
```

**Pentru Outlook/Office 365:**
```batch
@echo off
cd server

REM Configurare SMTP pentru Outlook/Office 365
set SMTP_HOST=smtp.office365.com
set SMTP_PORT=587
set SMTP_USER=nume.prenume@domeniu.com
set SMTP_PASSWORD=parola-ta
set EMAIL_FROM=nume.prenume@domeniu.com

REM Restul scriptului...
uvicorn main:app --reload
```

### Opțiunea 2: Fișier `.env` (recomandat pentru securitate)

Creează un fișier `.env` în directorul `server/`:

**Pentru Gmail:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=adresa-ta@gmail.com
SMTP_PASSWORD=parola-de-aplicatie
EMAIL_FROM=adresa-ta@gmail.com
```

**Pentru Outlook/Office 365:**
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=nume.prenume@domeniu.com
SMTP_PASSWORD=parola-ta
EMAIL_FROM=nume.prenume@domeniu.com
```

**⚠️ Important:** Adaugă `.env` în `.gitignore` pentru a nu comita parola în Git!

**📖 Pentru instrucțiuni detaliate, vezi:**
- `CONFIGURARE_GMAIL.md` - Ghid complet pentru Gmail
- `CONFIGURARE_OUTLOOK.md` - Ghid complet pentru Outlook/Office 365

## Funcționalitate

Când un admin modifică orarul în panoul de administrare:

1. Se identifică grupele modificate
2. Se găsesc toți studenții din grupele modificate (prin tabela `user_groups`)
3. Se trimit email-uri de notificare către toți studenții afectați

### Mesajul Email

Email-ul conține:
- Un subiect: "Notificare - Modificare Orar"
- Un mesaj HTML formatat care informează studentul că orarul grupei sale a fost modificat
- Informații despre grupă

## Testare

Pentru a testa dacă email-urile funcționează:

1. Configurează variabilele de mediu SMTP
2. Creează un student în sistem cu o postă corporativă validă
3. Asociază studentul cu o grupă
4. Modifică orarul pentru acea grupă în panoul admin
5. Verifică că studentul primește email-ul

## Note

- Dacă SMTP nu este configurat, sistemul va loga un mesaj de avertizare dar va continua să funcționeze normal
- Email-urile sunt trimise asincron și nu întrerup salvarea orarului
- Dacă trimiterea unui email eșuează pentru un student, eroarea este logată dar procesul continuă pentru ceilalți studenți

