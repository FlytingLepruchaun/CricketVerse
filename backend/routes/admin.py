import pymysql
from flask import Blueprint, jsonify, request
from backend.db import query_all, query_one, execute, transaction
from backend.auth import hash_password, verify_password, create_token, admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# =========================================================
# AUTHENTICATION
# =========================================================

@admin_bp.route("/login", methods=["POST"])
def admin_login():
    """Authenticate administrator and return signed JWT."""
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password are required."}), 400

    admin = query_one("SELECT * FROM AdminUsers WHERE username = %s", (username,))
    if not admin or not verify_password(password, admin["password_hash"]):
        return jsonify({"success": False, "error": "Invalid administrative credentials."}), 401

    token = create_token(admin["id"], admin["username"], admin.get("role", "admin"))
    return jsonify({
        "success": True,
        "token": token,
        "admin": {
            "id": admin["id"],
            "username": admin["username"],
            "email": admin.get("email"),
            "role": admin.get("role")
        }
    })

@admin_bp.route("/me", methods=["GET"])
@admin_required
def admin_me():
    """Verify administrator identity."""
    return jsonify({"success": True, "admin": request.current_admin})


# =========================================================
# TEAMS MANAGEMENT
# =========================================================

@admin_bp.route("/teams", methods=["POST"])
@admin_required
def add_team():
    """Add a new team to the database."""
    data = request.get_json() or {}
    team_id = data.get("team_id")
    team_name = data.get("team_name", "").strip()
    team_code = data.get("team_code", "").strip().upper()

    if not team_id or not team_name or not team_code:
        return jsonify({"success": False, "error": "team_id, team_name, and team_code are required."}), 400

    existing_id = query_one("SELECT team_id FROM Teams WHERE team_id = %s", (team_id,))
    if existing_id:
        return jsonify({"success": False, "error": f"Team with ID {team_id} already exists."}), 409

    existing_code = query_one("SELECT team_code FROM Teams WHERE team_code = %s", (team_code,))
    if existing_code:
        return jsonify({"success": False, "error": f"Team code '{team_code}' is already used."}), 409

    try:
        execute("INSERT INTO Teams (team_id, team_name, team_code) VALUES (%s, %s, %s)",
                (team_id, team_name, team_code))
        return jsonify({"success": True, "message": f"Team '{team_name}' created successfully."}), 201
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500

@admin_bp.route("/teams/<int:team_id>", methods=["PUT"])
@admin_required
def edit_team(team_id):
    """Update team details."""
    data = request.get_json() or {}
    team_name = data.get("team_name", "").strip()
    team_code = data.get("team_code", "").strip().upper()

    if not team_name or not team_code:
        return jsonify({"success": False, "error": "team_name and team_code are required."}), 400

    team = query_one("SELECT team_id FROM Teams WHERE team_id = %s", (team_id,))
    if not team:
        return jsonify({"success": False, "error": f"Team {team_id} not found."}), 404

    # Check unique code conflicts
    existing_code = query_one("SELECT team_id FROM Teams WHERE team_code = %s AND team_id != %s", (team_code, team_id))
    if existing_code:
        return jsonify({"success": False, "error": f"Team code '{team_code}' is already used by another team."}), 409

    try:
        execute("UPDATE Teams SET team_name = %s, team_code = %s WHERE team_id = %s",
                (team_name, team_code, team_id))
        return jsonify({"success": True, "message": "Team updated successfully."})
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500

@admin_bp.route("/teams/<int:team_id>", methods=["DELETE"])
@admin_required
def delete_team(team_id):
    """Safely delete a team, validating dependent records."""
    team = query_one("SELECT team_id, team_name FROM Teams WHERE team_id = %s", (team_id,))
    if not team:
        return jsonify({"success": False, "error": f"Team {team_id} not found."}), 404

    # Check dependent matches
    matches = query_one("SELECT COUNT(*) AS c FROM Matches WHERE team1_id = %s OR team2_id = %s OR winner_id = %s",
                        (team_id, team_id, team_id))
    if matches["c"] > 0:
        return jsonify({
            "success": False,
            "error": f"Cannot delete team '{team['team_name']}' because it is referenced in {matches['c']} match record(s)."
        }), 400

    # Check dependent players
    players = query_one("SELECT COUNT(*) AS c FROM Players WHERE team_id = %s", (team_id,))
    if players["c"] > 0:
        return jsonify({
            "success": False,
            "error": f"Cannot delete team '{team['team_name']}' because it contains {players['c']} player(s). Please reassign or delete players first."
        }), 400

    try:
        execute("DELETE FROM Teams WHERE team_id = %s", (team_id,))
        return jsonify({"success": True, "message": f"Team '{team['team_name']}' deleted successfully."})
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database constraint error: {str(e)}"}), 500


# =========================================================
# PLAYERS MANAGEMENT
# =========================================================

@admin_bp.route("/players", methods=["POST"])
@admin_required
def add_player():
    """Add a new player."""
    data = request.get_json() or {}
    player_id = data.get("player_id")
    player_name = data.get("player_name", "").strip()
    team_id = data.get("team_id")

    if not player_id or not player_name or not team_id:
        return jsonify({"success": False, "error": "player_id, player_name, and team_id are required."}), 400

    if query_one("SELECT player_id FROM Players WHERE player_id = %s", (player_id,)):
        return jsonify({"success": False, "error": f"Player ID {player_id} already exists."}), 409

    if not query_one("SELECT team_id FROM Teams WHERE team_id = %s", (team_id,)):
        return jsonify({"success": False, "error": f"Team ID {team_id} does not exist."}), 400

    try:
        execute("INSERT INTO Players (player_id, player_name, team_id) VALUES (%s, %s, %s)",
                (player_id, player_name, team_id))
        return jsonify({"success": True, "message": f"Player '{player_name}' added successfully."}), 201
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500

@admin_bp.route("/players/<int:player_id>", methods=["PUT"])
@admin_required
def edit_player(player_id):
    """Edit player name or team assignment."""
    data = request.get_json() or {}
    player_name = data.get("player_name", "").strip()
    team_id = data.get("team_id")

    if not player_name or not team_id:
        return jsonify({"success": False, "error": "player_name and team_id are required."}), 400

    if not query_one("SELECT player_id FROM Players WHERE player_id = %s", (player_id,)):
        return jsonify({"success": False, "error": f"Player {player_id} not found."}), 404

    if not query_one("SELECT team_id FROM Teams WHERE team_id = %s", (team_id,)):
        return jsonify({"success": False, "error": f"Target team ID {team_id} does not exist."}), 400

    try:
        execute("UPDATE Players SET player_name = %s, team_id = %s WHERE player_id = %s",
                (player_name, team_id, player_id))
        return jsonify({"success": True, "message": "Player updated successfully."})
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500

@admin_bp.route("/players/<int:player_id>", methods=["DELETE"])
@admin_required
def delete_player(player_id):
    """Delete a player and associated statistics."""
    player = query_one("SELECT player_id, player_name FROM Players WHERE player_id = %s", (player_id,))
    if not player:
        return jsonify({"success": False, "error": f"Player {player_id} not found."}), 404

    try:
        with transaction() as cur:
            cur.execute("DELETE FROM BattingSeason WHERE player_id = %s", (player_id,))
            cur.execute("DELETE FROM BowlingSeason WHERE player_id = %s", (player_id,))
            cur.execute("DELETE FROM Players WHERE player_id = %s", (player_id,))
        return jsonify({"success": True, "message": f"Player '{player['player_name']}' and associated stats deleted."})
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500


# =========================================================
# MATCHES MANAGEMENT
# =========================================================

@admin_bp.route("/matches", methods=["POST"])
@admin_required
def add_match():
    """Add a new match."""
    data = request.get_json() or {}
    match_number = data.get("match_number")
    match_date = data.get("match_date")
    team1_id = data.get("team1_id")
    team2_id = data.get("team2_id")
    venue = data.get("venue", "").strip()
    winner_id = data.get("winner_id")

    if not match_number or not match_date or not team1_id or not team2_id:
        return jsonify({"success": False, "error": "match_number, match_date, team1_id, and team2_id are required."}), 400

    if team1_id == team2_id:
        return jsonify({"success": False, "error": "Team 1 and Team 2 cannot be the same team."}), 400

    if query_one("SELECT match_number FROM Matches WHERE match_number = %s", (match_number,)):
        return jsonify({"success": False, "error": f"Match #{match_number} already exists."}), 409

    if not query_one("SELECT team_id FROM Teams WHERE team_id = %s", (team1_id,)):
        return jsonify({"success": False, "error": f"Team 1 (ID {team1_id}) does not exist."}), 400

    if not query_one("SELECT team_id FROM Teams WHERE team_id = %s", (team2_id,)):
        return jsonify({"success": False, "error": f"Team 2 (ID {team2_id}) does not exist."}), 400

    if winner_id and winner_id not in (team1_id, team2_id):
        return jsonify({"success": False, "error": "Winner must be one of the participating teams (or NULL for pending)."}), 400

    try:
        execute("""
            INSERT INTO Matches (match_number, match_date, team1_id, team2_id, venue, winner_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (match_number, match_date, team1_id, team2_id, venue, winner_id if winner_id else None))
        return jsonify({"success": True, "message": f"Match #{match_number} created successfully."}), 201
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500

@admin_bp.route("/matches/<int:match_number>", methods=["PUT"])
@admin_required
def edit_match(match_number):
    """Update match details or record winner for a pending match."""
    data = request.get_json() or {}
    match_date = data.get("match_date")
    team1_id = data.get("team1_id")
    team2_id = data.get("team2_id")
    venue = data.get("venue", "").strip()
    winner_id = data.get("winner_id")  # Can be NULL or integer

    match = query_one("SELECT match_number FROM Matches WHERE match_number = %s", (match_number,))
    if not match:
        return jsonify({"success": False, "error": f"Match #{match_number} not found."}), 404

    if team1_id and team2_id and team1_id == team2_id:
        return jsonify({"success": False, "error": "Team 1 and Team 2 cannot be the same team."}), 400

    if winner_id and team1_id and team2_id and winner_id not in (team1_id, team2_id):
        return jsonify({"success": False, "error": "Winner must be either Team 1 or Team 2."}), 400

    try:
        execute("""
            UPDATE Matches 
            SET match_date = %s, team1_id = %s, team2_id = %s, venue = %s, winner_id = %s
            WHERE match_number = %s
        """, (match_date, team1_id, team2_id, venue, winner_id if winner_id else None, match_number))
        return jsonify({"success": True, "message": f"Match #{match_number} updated successfully."})
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500

@admin_bp.route("/matches/<int:match_number>", methods=["DELETE"])
@admin_required
def delete_match(match_number):
    """Delete a match record."""
    if not query_one("SELECT match_number FROM Matches WHERE match_number = %s", (match_number,)):
        return jsonify({"success": False, "error": f"Match #{match_number} not found."}), 404

    try:
        execute("DELETE FROM Matches WHERE match_number = %s", (match_number,))
        return jsonify({"success": True, "message": f"Match #{match_number} deleted successfully."})
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500


# =========================================================
# BATTING STATS MANAGEMENT
# =========================================================

@admin_bp.route("/batting", methods=["POST"])
@admin_required
def save_batting_record():
    """Create or update batting season record."""
    data = request.get_json() or {}
    player_id = data.get("player_id")
    runs = data.get("runs", 0)
    balls_faced = data.get("balls_faced", 0)
    fours = data.get("fours", 0)
    sixes = data.get("sixes", 0)
    batting_average = data.get("batting_average")
    strike_rate = data.get("strike_rate")

    if not player_id:
        return jsonify({"success": False, "error": "player_id is required."}), 400

    if not query_one("SELECT player_id FROM Players WHERE player_id = %s", (player_id,)):
        return jsonify({"success": False, "error": f"Player {player_id} does not exist."}), 400

    # Auto calculate strike rate if not provided and balls_faced > 0
    if strike_rate is None and balls_faced > 0:
        strike_rate = round((runs / balls_faced) * 100, 2)

    try:
        sql = """
            INSERT INTO BattingSeason (player_id, runs, balls_faced, fours, sixes, batting_average, strike_rate)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                runs = VALUES(runs),
                balls_faced = VALUES(balls_faced),
                fours = VALUES(fours),
                sixes = VALUES(sixes),
                batting_average = VALUES(batting_average),
                strike_rate = VALUES(strike_rate)
        """
        execute(sql, (player_id, runs, balls_faced, fours, sixes, batting_average, strike_rate))
        return jsonify({"success": True, "message": f"Batting record for player {player_id} saved successfully."})
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500

@admin_bp.route("/batting/<int:player_id>", methods=["DELETE"])
@admin_required
def delete_batting_record(player_id):
    """Delete a batting season record."""
    try:
        execute("DELETE FROM BattingSeason WHERE player_id = %s", (player_id,))
        return jsonify({"success": True, "message": f"Batting record for player {player_id} deleted."})
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500


# =========================================================
# BOWLING STATS MANAGEMENT
# =========================================================

@admin_bp.route("/bowling", methods=["POST"])
@admin_required
def save_bowling_record():
    """Create or update bowling season record."""
    data = request.get_json() or {}
    player_id = data.get("player_id")
    wickets = data.get("wickets", 0)
    economy_rate = data.get("economy_rate")

    if not player_id or economy_rate is None:
        return jsonify({"success": False, "error": "player_id and economy_rate are required."}), 400

    if not query_one("SELECT player_id FROM Players WHERE player_id = %s", (player_id,)):
        return jsonify({"success": False, "error": f"Player {player_id} does not exist."}), 400

    try:
        sql = """
            INSERT INTO BowlingSeason (player_id, wickets, economy_rate)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                wickets = VALUES(wickets),
                economy_rate = VALUES(economy_rate)
        """
        execute(sql, (player_id, wickets, economy_rate))
        return jsonify({"success": True, "message": f"Bowling record for player {player_id} saved successfully."})
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500

@admin_bp.route("/bowling/<int:player_id>", methods=["DELETE"])
@admin_required
def delete_bowling_record(player_id):
    """Delete a bowling season record."""
    try:
        execute("DELETE FROM BowlingSeason WHERE player_id = %s", (player_id,))
        return jsonify({"success": True, "message": f"Bowling record for player {player_id} deleted."})
    except pymysql.MySQLError as e:
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
