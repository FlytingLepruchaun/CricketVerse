# 🚀 CricketVerse — Complete Setup Guide for Other Computers

This guide explains how to run **CricketVerse** on any friend's computer, college lab PC, or secondary laptop (Windows, macOS, or Linux).

---

## 🎯 Choose the Best Method for Your Friend

| Method | What Your Friend Needs | Effort | Best For |
|---|---|---|---|
| **[Method 1: Wi-Fi Instant Share](#method-1-instant-share-over-wi-fi-no-install-needed)** | Nothing! Just a browser on their phone or PC | ⚡ 10 seconds | Showing it immediately to a friend on the same WiFi/hotspot |
| **[Method 2: 1-Click with Docker](#method-2-docker-1-click-setup-recommended)** | Docker Desktop installed | 🚀 1 command | Zero manual installation (MySQL & Flask run in containers) |
| **[Method 3: Standard Local Run](#method-3-standard-local-setup-python--mysql)** | Python 3.8+ & MySQL 8.0 | 🛠️ 2 minutes | Running independently on your friend's PC |

---

## Method 1: Instant Share over Wi-Fi (No Install Needed!)

If you and your friend are on the **same Wi-Fi network** (or your phone's mobile hotspot):

1. **On your laptop**, start CricketVerse:
   ```cmd
   run.bat
   ```
   *(or `python backend/app.py`)*

2. Find your laptop's Wi-Fi IP address:
   - On Windows: Open Command Prompt and type `ipconfig` (look for `IPv4 Address`, e.g., `192.168.0.222`).
   - On Mac/Linux: Open Terminal and type `ifconfig` or `ip a`.

3. **On your friend's laptop, phone, or tablet**:
   - Open any browser (Chrome, Safari, Edge, Firefox).
   - Go to:
     ```
     http://YOUR_IP:5000
     ```
     *(Example: `http://192.168.0.222:5000`)*

4. 🎉 The complete CricketVerse application opens immediately on their screen with full functionality!

---

## Method 2: Docker 1-Click Setup (Recommended)

If your friend has **Docker Desktop** installed, they do **NOT** need to install Python, Node.js, or MySQL Server on their PC. Docker runs everything automatically in isolated containers.

### Steps:
1. **Transfer the project folder** to your friend's PC (via Pendrive, Google Drive ZIP, or Git).
2. Open a terminal / command prompt inside the project folder:
   ```bash
   cd "cricketverse"
   ```
3. Run:
   ```bash
   docker compose up --build
   ```
4. **What happens automatically**:
   - Docker starts a **MySQL 8.0** container.
   - The database `cricketverse` is created and auto-populated with all 10 teams, 110 players, 74 matches, and season statistics using `database/schema.sql`.
   - The Flask API and pre-built React frontend start on port `5000`.
5. Open your browser and go to:
   ```
   http://localhost:5000
   ```
6. To stop the app anytime:
   ```bash
   docker compose down
   ```

---

## Method 3: Standard Local Setup (Python + MySQL)

Use this method if your friend wants to run the project natively using Python and MySQL on their computer.

> **💡 Great News:** Your friend **DOES NOT need to install Node.js or npm**!  
> The production React frontend is already built into `frontend/dist/` and is served directly by Flask. Only **Python** and **MySQL** are required.

### Prerequisites:
1. **Python 3.8 to 3.13** installed ([python.org](https://www.python.org/downloads/)).
   - *Important during installation:* Check the box **"Add Python to PATH"**.
2. **MySQL 8.0** installed and running (via MySQL Server, MySQL Workbench, or XAMPP).

---

### Step-by-Step Instructions:

#### Step 1: Copy the Project
Copy the `dbms cbp` (or `cricketverse`) folder to your friend's PC using a USB Drive or ZIP file.

#### Step 2: Configure Database Credentials in `.env`
In the project root folder:
1. Copy `.env.example` to create a new `.env` file:
   - On Windows: `copy .env.example .env`
   - On Mac/Linux: `cp .env.example .env`
2. Open `.env` in Notepad or VS Code:
   ```ini
   FLASK_ENV=development
   FLASK_PORT=5000
   FLASK_HOST=0.0.0.0
   SECRET_KEY=cricketverse-secret-key-2026

   # Configure your friend's MySQL settings:
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=cricketverse
   DB_USER=root
   DB_PASSWORD=YOUR_FRIENDS_MYSQL_PASSWORD

   JWT_SECRET=cricketverse-jwt-secret-2026
   JWT_EXPIRATION_HOURS=24
   ```
   *Replace `YOUR_FRIENDS_MYSQL_PASSWORD` with the password your friend set when installing MySQL.*

---

#### Step 3: Install Python Dependencies
Open PowerShell, Command Prompt, or Terminal inside the project folder:
```bash
pip install -r requirements.txt
```
*(Packages installed: `flask`, `flask-cors`, `pymysql`, `cryptography`, `python-dotenv`, `pyjwt`, `werkzeug`)*

---

#### Step 4: Initialize the Database (Automatic 1-Command Setup)
Run the database setup script:
```bash
python database/init_db.py
```

**What this script does automatically**:
- Connects to your friend's MySQL server.
- Creates the `CricketVerse` database if it doesn't already exist.
- Creates all tables (`Teams`, `Players`, `Matches`, `BattingSeason`, `BowlingSeason`, `AdminUsers`).
- Inserts all 10 teams, 110 players, 74 matches, and all batting/bowling statistics.
- Creates the default administrator account (`admin` / `Admin@123`).
- Displays a verification report showing exact row counts.

---

#### Step 5: Start the Application!
- **On Windows**: Double-click `run.bat` or run:
  ```cmd
  run.bat
  ```
- **On Mac / Linux**: Run:
  ```bash
  chmod +x run.sh
  ./run.sh
  ```
- **Manual Command**:
  ```bash
  python backend/app.py
  ```

Open your browser and navigate to:
```
http://localhost:5000
```

---

## 🔐 Administrator Login

- Click on the **Admin Portal** link in the navigation bar.
- **Username:** `admin`
- **Password:** `Admin@123`
- Inside the Admin Portal, you can add, edit, or delete teams, players, matches, and batting/bowling statistics.

---

## 🧪 Verify That Everything Works

Your friend or faculty can run the automated test suite to prove that all endpoints, queries, and business logic work:
```bash
python -m unittest backend/tests/test_api.py
```
Expected output:
```
Ran 10 tests in 3.88s
OK
```

---

## ❓ Troubleshooting & FAQs

### 1. Error: `Access denied for user 'root'@'localhost'`
- **Cause:** The password in `.env` does not match your friend's MySQL root password.
- **Fix:** Open `.env` and set `DB_PASSWORD` to the correct password. If your friend's root user has no password, leave it blank (`DB_PASSWORD=`).

### 2. Error: `Can't connect to MySQL server on 'localhost'`
- **Cause:** MySQL service is stopped.
- **Fix (Windows):** Open Services (`services.msc`), find **MySQL80**, right-click and select **Start** (or run `net start MySQL80` in admin Command Prompt).
- **Fix (Mac):** Run `brew services start mysql`.
- **Fix (Linux):** Run `sudo systemctl start mysql`.

### 3. Port 5000 is already in use
- **Fix:** Change `FLASK_PORT=5001` in `.env` and restart.

### 4. How to share across Wi-Fi if friend can't connect?
- **Fix:** On Windows Defender Firewall, allow port `5000` or temporarily set network profile to "Private". Ensure both devices are on the exact same Wi-Fi network.
