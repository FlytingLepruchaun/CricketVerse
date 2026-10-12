import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from backend.config import Config
from backend.db import query_one

def hash_password(password: str) -> str:
    """Hash password using pbkdf2:sha256."""
    return generate_password_hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return check_password_hash(hashed_password, plain_password)

def create_token(user_id: int, username: str, role: str = "admin") -> str:
    """Generate a signed JWT token."""
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")

def decode_token(token: str):
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def admin_required(f):
    """Decorator to protect administrative endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({
                "success": False,
                "error": "Authorization token required. Please log in as admin."
            }), 401

        token = auth_header.split(" ", 1)[1].strip()
        payload = decode_token(token)
        if not payload:
            return jsonify({
                "success": False,
                "error": "Invalid or expired token. Please log in again."
            }), 401

        # Verify user still exists in database
        user = query_one("SELECT id, username, role FROM AdminUsers WHERE id = %s", (payload.get("user_id"),))
        if not user:
            return jsonify({
                "success": False,
                "error": "Admin account not found or revoked."
            }), 401

        request.current_admin = user
        return f(*args, **kwargs)
    return decorated
