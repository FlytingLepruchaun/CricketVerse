@echo off
echo ========================================================
echo   CRICKETVERSE - IPL ANALYTICS PLATFORM LAUNCHER
echo ========================================================

REM 1. Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM 2. Check .env file
if not exist .env (
    echo [INFO] .env file not found. Copying from .env.example...
    copy .env.example .env
    echo Please configure your MySQL credentials in .env and run again.
    pause
    exit /b 0
)

REM 3. Install requirements
echo [INFO] Verifying backend dependencies...
python -m pip install -r requirements.txt --quiet

REM 4. Verify & Initialize Database
echo [INFO] Verifying MySQL connection and database schema...
python database/init_db.py
if %errorlevel% neq 0 (
    echo [WARNING] Database verification encountered an issue. Check MySQL status or .env credentials.
    pause
    exit /b 1
)

REM 5. Display IP Address for access on other devices (Phones, Tablets)
echo --------------------------------------------------------
echo  ACCESS CRICKETVERSE ON ANY DEVICE:
echo    - On this computer: http://localhost:5000
echo    - On phones/other devices on same WiFi:
ipconfig | findstr /i "IPv4"
echo --------------------------------------------------------

REM 6. Launch Application
echo [INFO] Starting CricketVerse Unified Server on port 5000...
python backend/app.py
pause
