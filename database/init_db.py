import os
import sys
import pymysql
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

# Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_NAME = os.getenv("DB_NAME", "cricketverse")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def test_connection():
    """Test raw connection to MySQL server."""
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            connect_timeout=5
        )
        conn.close()
        return True, "Successfully reached MySQL server."
    except pymysql.MySQLError as err:
        return False, f"Failed to connect to MySQL ({DB_HOST}:{DB_PORT}): {err}"

def initialize_database():
    print("=" * 60)
    print("CRICKETVERSE DATABASE INITIALIZATION & VERIFICATION")
    print("=" * 60)
    print(f"Connecting to MySQL Host: {DB_HOST}:{DB_PORT} as User: {DB_USER}")

    ok, msg = test_connection()
    if not ok:
        print("\n[ERROR] Database connection failed:")
        print(f"  {msg}")
        print("\nTroubleshooting tips:")
        print("  1. Verify MySQL service is running (e.g. 'net start MySQL80').")
        print("  2. Verify DB_HOST, DB_PORT, DB_USER, and DB_PASSWORD in your .env file.")
        print("  3. Run 'python database/init_db.py' again after fixing credentials.")
        sys.exit(1)

    print("[SUCCESS] " + msg)

    try:
        # Connect to MySQL server and ensure DB exists
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            autocommit=True
        )
        with conn.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print(f"[SUCCESS] Database `{DB_NAME}` is ready.")
        conn.close()

        # Connect directly to the database
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor
        )

        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        if not os.path.exists(schema_path):
            print(f"[ERROR] schema.sql not found at {schema_path}")
            sys.exit(1)

        with open(schema_path, "r", encoding="utf-8") as f:
            sql_script = f.read()

        # Execute statements from schema.sql
        print("\nChecking database tables and records...")
        with conn.cursor() as cur:
            statements = [s.strip() for s in sql_script.split(";") if s.strip()]
            for stmt in statements:
                # Skip comments or USE/CREATE DATABASE statements handled above
                if stmt.upper().startswith("USE ") or stmt.upper().startswith("CREATE DATABASE"):
                    continue
                try:
                    cur.execute(stmt)
                except pymysql.MySQLError as e:
                    # Ignore table already exists or duplicate key warnings
                    pass
            conn.commit()

            # Ensure admin user exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS AdminUsers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    email VARCHAR(100),
                    role VARCHAR(20) DEFAULT 'admin',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("SELECT * FROM AdminUsers WHERE username = %s", ("admin",))
            if not cur.fetchone():
                admin_hash = generate_password_hash("Admin@123")
                cur.execute(
                    "INSERT INTO AdminUsers (username, password_hash, email, role) VALUES (%s, %s, %s, %s)",
                    ("admin", admin_hash, "admin@cricketverse.local", "superadmin")
                )
                conn.commit()
                print("[SUCCESS] Initialized default admin user: 'admin' (Password: 'Admin@123')")

            # Report table statistics
            print("\nDatabase Table Verification:")
            tables = ["Teams", "Players", "Matches", "BattingSeason", "BowlingSeason", "AdminUsers"]
            for table in tables:
                cur.execute(f"SELECT COUNT(*) AS cnt FROM `{table}`")
                res = cur.fetchone()
                print(f"  - {table}: {res['cnt']} record(s)")

        conn.close()
        print("\n[SUCCESS] CricketVerse database verification completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] An error occurred while initializing database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    initialize_database()
