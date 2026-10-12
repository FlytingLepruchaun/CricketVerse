import pymysql
import pymysql.cursors
from decimal import Decimal
from datetime import date, datetime
from contextlib import contextmanager
from backend.config import Config

def get_connection():
    """Create and return a new MySQL connection with DictCursor."""
    return pymysql.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        connect_timeout=5
    )

def serialize_row(row):
    """Convert Decimals and dates in dict rows to JSON-serializable types."""
    if not row:
        return row
    cleaned = {}
    for k, v in row.items():
        if isinstance(v, Decimal):
            cleaned[k] = float(v)
        elif isinstance(v, (date, datetime)):
            cleaned[k] = v.isoformat()
        else:
            cleaned[k] = v
    return cleaned

def serialize_rows(rows):
    """Serialize a list of dict rows."""
    if not rows:
        return []
    return [serialize_row(r) for r in rows]

def query_all(sql, params=None):
    """Execute a SELECT query and return all rows serialized."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            rows = cur.fetchall()
            return serialize_rows(rows)
    finally:
        conn.close()

def query_one(sql, params=None):
    """Execute a SELECT query and return a single serialized row or None."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            row = cur.fetchone()
            return serialize_row(row) if row else None
    finally:
        conn.close()

def execute(sql, params=None):
    """Execute an INSERT, UPDATE, or DELETE query and commit."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            affected = cur.execute(sql, params or ())
            last_id = cur.lastrowid
            conn.commit()
            return {"affected_rows": affected, "last_id": last_id}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

@contextmanager
def transaction():
    """Context manager for executing multiple queries within a single transaction."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def check_db_health():
    """Check database connection and return metrics."""
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT VERSION() AS version;")
            ver = cur.fetchone()
            cur.execute("SELECT COUNT(*) AS c FROM Teams")
            t_cnt = cur.fetchone()['c']
            cur.execute("SELECT COUNT(*) AS c FROM Players")
            p_cnt = cur.fetchone()['c']
            cur.execute("SELECT COUNT(*) AS c FROM Matches")
            m_cnt = cur.fetchone()['c']
        conn.close()
        return {
            "status": "healthy",
            "database": Config.DB_NAME,
            "host": Config.DB_HOST,
            "port": Config.DB_PORT,
            "version": ver['version'],
            "counts": {
                "teams": t_cnt,
                "players": p_cnt,
                "matches": m_cnt
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "database": Config.DB_NAME,
            "host": Config.DB_HOST,
            "port": Config.DB_PORT
        }
