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

REQUIRED_COLUMNS = {
    "Teams": {
        "team_id": "INT NOT NULL",
        "team_name": "VARCHAR(100) NOT NULL",
        "team_code": "VARCHAR(10) NOT NULL",
    },
    "Players": {
        "player_id": "INT NOT NULL",
        "player_name": "VARCHAR(100) NOT NULL",
        "team_id": "INT NOT NULL",
    },
    "Matches": {
        "match_number": "INT NOT NULL",
        "match_date": "DATE NOT NULL",
        "team1_id": "INT NOT NULL",
        "team2_id": "INT NOT NULL",
        "venue": "VARCHAR(150) NOT NULL",
    },
    "BattingSeason": {
        "player_id": "INT NOT NULL",
        "runs": "INT NOT NULL DEFAULT 0",
        "balls_faced": "INT NOT NULL",
        "fours": "INT NOT NULL",
        "sixes": "INT NOT NULL",
    },
    "BowlingSeason": {
        "player_id": "INT NOT NULL",
        "wickets": "INT NOT NULL",
        "economy_rate": "DECIMAL(5,2) NOT NULL",
    },
    "AdminUsers": {
        "id": "INT NOT NULL AUTO_INCREMENT",
        "username": "VARCHAR(50) NOT NULL",
        "password_hash": "VARCHAR(255) NOT NULL",
        "role": "VARCHAR(20) NOT NULL DEFAULT 'admin'",
        "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
}

CHECK_CONSTRAINTS = {
    "Teams": {
        "chk_teams_id_positive": "team_id > 0",
        "chk_teams_name_nonblank": "CHAR_LENGTH(TRIM(team_name)) > 0",
        "chk_teams_code_nonblank": "CHAR_LENGTH(TRIM(team_code)) > 0",
    },
    "Players": {
        "chk_players_id_positive": "player_id > 0",
        "chk_players_name_nonblank": "CHAR_LENGTH(TRIM(player_name)) > 0",
        "chk_players_team_positive": "team_id > 0",
    },
    "Matches": {
        "chk_matches_number_positive": "match_number > 0",
        "chk_matches_different_teams": "team1_id <> team2_id",
        "chk_matches_venue_nonblank": "CHAR_LENGTH(TRIM(venue)) > 0",
        "chk_matches_winner_participates": "winner_id IS NULL OR winner_id IN (team1_id, team2_id)",
        "chk_matches_team1_score_complete": (
            "(team1_runs IS NULL AND team1_overs IS NULL AND team1_wickets_lost IS NULL) "
            "OR (team1_runs IS NOT NULL AND team1_overs IS NOT NULL AND team1_wickets_lost IS NOT NULL)"
        ),
        "chk_matches_team2_score_complete": (
            "(team2_runs IS NULL AND team2_overs IS NULL AND team2_wickets_lost IS NULL) "
            "OR (team2_runs IS NOT NULL AND team2_overs IS NOT NULL AND team2_wickets_lost IS NOT NULL)"
        ),
        "chk_matches_team1_overs_valid": (
            "team1_overs IS NULL OR (team1_overs <= 20 AND MOD(team1_overs * 10, 10) <= 5)"
        ),
        "chk_matches_team2_overs_valid": (
            "team2_overs IS NULL OR (team2_overs <= 20 AND MOD(team2_overs * 10, 10) <= 5)"
        ),
        "chk_matches_team1_wickets_valid": "team1_wickets_lost IS NULL OR team1_wickets_lost <= 10",
        "chk_matches_team2_wickets_valid": "team2_wickets_lost IS NULL OR team2_wickets_lost <= 10",
        "chk_matches_margin_complete": (
            "(winning_margin IS NULL AND winning_margin_type IS NULL) "
            "OR (winning_margin IS NOT NULL AND winning_margin_type IS NOT NULL)"
        ),
        "chk_matches_margin_positive": "winning_margin IS NULL OR winning_margin > 0",
    },
    "BattingSeason": {
        "chk_batting_player_positive": "player_id > 0",
        "chk_batting_counts_nonnegative": "runs >= 0 AND balls_faced >= 0 AND fours >= 0 AND sixes >= 0",
        "chk_batting_boundary_runs": "runs >= (fours * 4) + (sixes * 6)",
        "chk_batting_average_nonnegative": "batting_average IS NULL OR batting_average >= 0",
        "chk_batting_strike_rate_nonnegative": "strike_rate IS NULL OR strike_rate >= 0",
    },
    "BowlingSeason": {
        "chk_bowling_player_positive": "player_id > 0",
        "chk_bowling_wickets_nonnegative": "wickets >= 0",
        "chk_bowling_economy_nonnegative": "economy_rate >= 0",
    },
    "AdminUsers": {
        "chk_admin_username_nonblank": "CHAR_LENGTH(TRIM(username)) > 0",
        "chk_admin_password_hash_nonblank": "CHAR_LENGTH(TRIM(password_hash)) > 0",
        "chk_admin_role_nonblank": "CHAR_LENGTH(TRIM(role)) > 0",
    },
}

def migrate_match_score_columns(cur):
    """Add match score columns to an existing Matches table."""
    cur.execute("SHOW TABLES LIKE 'Matches'")
    if not cur.fetchone():
        return

    cur.execute("SHOW COLUMNS FROM Matches")
    existing_columns = {column["Field"] for column in cur.fetchall()}
    score_columns = (
        ("team1_runs", "INT UNSIGNED NULL"),
        ("team1_overs", "DECIMAL(4,1) UNSIGNED NULL"),
        ("team1_wickets_lost", "TINYINT UNSIGNED NULL"),
        ("team2_runs", "INT UNSIGNED NULL"),
        ("team2_overs", "DECIMAL(4,1) UNSIGNED NULL"),
        ("team2_wickets_lost", "TINYINT UNSIGNED NULL"),
        ("winning_margin", "INT UNSIGNED NULL"),
        ("winning_margin_type", "ENUM('runs', 'wickets') NULL"),
    )

    added_columns = []
    for column_name, column_definition in score_columns:
        if column_name not in existing_columns:
            cur.execute(f"ALTER TABLE Matches ADD COLUMN {column_name} {column_definition}")
            added_columns.append(column_name)

    if added_columns:
        print(f"[SUCCESS] Migrated Matches table columns: {', '.join(added_columns)}")
    else:
        print("[SUCCESS] Matches score columns are already present.")

def migrate_schema_constraints(cur):
    """Enforce required values and domain checks on existing tables."""
    for table, columns in REQUIRED_COLUMNS.items():
        cur.execute(f"SHOW COLUMNS FROM `{table}`")
        existing_columns = {column["Field"]: column for column in cur.fetchall()}
        for column_name, definition in columns.items():
            column = existing_columns.get(column_name)
            if column is None:
                raise RuntimeError(f"Required column `{table}`.`{column_name}` is missing.")
            if column["Null"] == "YES" or (
                column_name == "runs" and column["Default"] is None
            ):
                cur.execute(
                    f"ALTER TABLE `{table}` MODIFY COLUMN `{column_name}` {definition}"
                )

    cur.execute("""
        SELECT TABLE_NAME, CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'CHECK'
    """)
    existing_checks = {
        (row["TABLE_NAME"].lower(), row["CONSTRAINT_NAME"].lower())
        for row in cur.fetchall()
    }
    added_checks = []
    for table, constraints in CHECK_CONSTRAINTS.items():
        for name, expression in constraints.items():
            if (table.lower(), name.lower()) not in existing_checks:
                cur.execute(
                    f"ALTER TABLE `{table}` ADD CONSTRAINT `{name}` CHECK ({expression})"
                )
                added_checks.append(name)

    if added_checks:
        print(f"[SUCCESS] Added database checks: {', '.join(added_checks)}")
    else:
        print("[SUCCESS] Database checks are already present.")

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
            migrate_match_score_columns(cur)
            statements = [s.strip() for s in sql_script.split(";") if s.strip()]
            for stmt in statements:
                # Skip comments or USE/CREATE DATABASE statements handled above
                if stmt.upper().startswith("USE ") or stmt.upper().startswith("CREATE DATABASE"):
                    continue
                try:
                    cur.execute(stmt)
                except pymysql.MySQLError as e:
                    raise RuntimeError(f"Failed to execute schema statement: {e}") from e
            migrate_schema_constraints(cur)
            conn.commit()

            # Ensure admin user exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS AdminUsers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    email VARCHAR(100),
                    role VARCHAR(20) NOT NULL DEFAULT 'admin',
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT chk_admin_username_nonblank CHECK (CHAR_LENGTH(TRIM(username)) > 0),
                    CONSTRAINT chk_admin_password_hash_nonblank CHECK (CHAR_LENGTH(TRIM(password_hash)) > 0),
                    CONSTRAINT chk_admin_role_nonblank CHECK (CHAR_LENGTH(TRIM(role)) > 0)
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
