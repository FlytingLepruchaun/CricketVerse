#!/bin/bash
set -e

echo "========================================================"
echo "  CRICKETVERSE - IPL ANALYTICS PLATFORM LAUNCHER"
echo "========================================================"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 is not installed or not in PATH!"
    exit 1
fi

# Check .env
if [ ! -f .env ]; then
    echo "[INFO] .env not found. Copying .env.example..."
    cp .env.example .env
    echo "Please configure your database credentials in .env and restart."
    exit 0
fi

# Install dependencies
echo "[INFO] Installing Python dependencies..."
python3 -m pip install -r requirements.txt --quiet

# Verify Database
echo "[INFO] Verifying MySQL connection and database schema..."
python3 database/init_db.py

# Build the frontend served by Flask
if ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] npm is not installed or not in PATH. Install Node.js 20+ and try again."
    exit 1
fi
echo "[INFO] Rebuilding frontend for the unified server..."
(cd frontend && npm run build)

# Display IP for multi-device access
echo "--------------------------------------------------------"
echo " ACCESS CRICKETVERSE ON ANY DEVICE:"
echo "   - On this machine: http://localhost:5000"
echo "   - On phones/other devices on same WiFi:"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "     http://" $2 ":5000"}' || true
echo "--------------------------------------------------------"

# Launch Flask Server
echo "[INFO] Starting CricketVerse Unified Server on port 5000..."
python3 backend/app.py
