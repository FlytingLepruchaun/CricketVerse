from flask import Blueprint, jsonify, request
from backend.db import query_all, query_one

teams_bp = Blueprint("teams", __name__, url_prefix="/api/teams")

@teams_bp.route("", methods=["GET"])
def get_all_teams():
    """Retrieve all teams with squad count and win totals."""
    sql = """
        SELECT 
            t.team_id,
            t.team_name,
            t.team_code,
            COUNT(DISTINCT p.player_id) AS squad_size,
            (SELECT COUNT(*) FROM Matches m WHERE (m.team1_id = t.team_id OR m.team2_id = t.team_id)) AS total_matches,
            (SELECT COUNT(*) FROM Matches m WHERE m.winner_id = t.team_id) AS wins,
            COALESCE(SUM(b.runs), 0) AS total_runs,
            COALESCE(SUM(bw.wickets), 0) AS total_wickets
        FROM Teams t
        LEFT JOIN Players p ON t.team_id = p.team_id
        LEFT JOIN BattingSeason b ON p.player_id = b.player_id
        LEFT JOIN BowlingSeason bw ON p.player_id = bw.player_id
        GROUP BY t.team_id, t.team_name, t.team_code
        ORDER BY t.team_name ASC
    """
    teams = query_all(sql)
    for team in teams:
        tot = team["total_matches"]
        wins = team["wins"]
        team["win_percentage"] = round((wins / tot * 100), 1) if tot > 0 else 0.0
    return jsonify({"success": True, "data": teams})

@teams_bp.route("/<int:team_id>", methods=["GET"])
def get_team_detail(team_id):
    """Retrieve a single team and its overall summary."""
    team = query_one("""
        SELECT 
            t.team_id,
            t.team_name,
            t.team_code,
            COUNT(DISTINCT p.player_id) AS squad_size,
            (SELECT COUNT(*) FROM Matches m WHERE (m.team1_id = t.team_id OR m.team2_id = t.team_id)) AS total_matches,
            (SELECT COUNT(*) FROM Matches m WHERE m.winner_id = t.team_id) AS wins,
            COALESCE(SUM(b.runs), 0) AS total_runs,
            COALESCE(SUM(b.sixes), 0) AS total_sixes,
            COALESCE(SUM(b.fours), 0) AS total_fours,
            COALESCE(SUM(bw.wickets), 0) AS total_wickets
        FROM Teams t
        LEFT JOIN Players p ON t.team_id = p.team_id
        LEFT JOIN BattingSeason b ON p.player_id = b.player_id
        LEFT JOIN BowlingSeason bw ON p.player_id = bw.player_id
        WHERE t.team_id = %s
        GROUP BY t.team_id, t.team_name, t.team_code
    """, (team_id,))

    if not team:
        return jsonify({"success": False, "error": f"Team with ID {team_id} not found."}), 404

    tot = team["total_matches"]
    wins = team["wins"]
    team["win_percentage"] = round((wins / tot * 100), 1) if tot > 0 else 0.0
    return jsonify({"success": True, "data": team})

@teams_bp.route("/<int:team_id>/players", methods=["GET"])
def get_team_players(team_id):
    """Retrieve all players in a team's squad with batting and bowling records."""
    team = query_one("SELECT team_id, team_name, team_code FROM Teams WHERE team_id = %s", (team_id,))
    if not team:
        return jsonify({"success": False, "error": f"Team with ID {team_id} not found."}), 404

    sql = """
        SELECT 
            p.player_id,
            p.player_name,
            p.team_id,
            t.team_name,
            t.team_code,
            -- Batting Season
            b.runs,
            b.balls_faced,
            b.fours,
            b.sixes,
            b.batting_average,
            b.strike_rate,
            -- Bowling Season
            bw.wickets,
            bw.economy_rate
        FROM Players p
        JOIN Teams t ON p.team_id = t.team_id
        LEFT JOIN BattingSeason b ON p.player_id = b.player_id
        LEFT JOIN BowlingSeason bw ON p.player_id = bw.player_id
        WHERE p.team_id = %s
        ORDER BY b.runs DESC, p.player_name ASC
    """
    players = query_all(sql, (team_id,))
    return jsonify({"success": True, "team": team, "data": players})

@teams_bp.route("/<int:team_id>/matches", methods=["GET"])
def get_team_matches(team_id):
    """Retrieve all matches involving this team."""
    team = query_one("SELECT team_id, team_name, team_code FROM Teams WHERE team_id = %s", (team_id,))
    if not team:
        return jsonify({"success": False, "error": f"Team with ID {team_id} not found."}), 404

    sql = """
        SELECT 
            m.match_number,
            m.match_date,
            m.venue,
            t1.team_id AS team1_id,
            t1.team_name AS team1_name,
            t1.team_code AS team1_code,
            t2.team_id AS team2_id,
            t2.team_name AS team2_name,
            t2.team_code AS team2_code,
            w.team_id AS winner_id,
            w.team_name AS winner_name,
            w.team_code AS winner_code,
            CASE 
                WHEN m.winner_id IS NULL THEN 'Pending'
                WHEN m.winner_id = %s THEN 'Won'
                ELSE 'Lost'
            END AS result_status
        FROM Matches m
        JOIN Teams t1 ON m.team1_id = t1.team_id
        JOIN Teams t2 ON m.team2_id = t2.team_id
        LEFT JOIN Teams w ON m.winner_id = w.team_id
        WHERE m.team1_id = %s OR m.team2_id = %s
        ORDER BY m.match_date ASC, m.match_number ASC
    """
    matches = query_all(sql, (team_id, team_id, team_id))
    return jsonify({"success": True, "team": team, "data": matches})
