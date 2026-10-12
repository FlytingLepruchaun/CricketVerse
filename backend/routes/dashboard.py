from flask import Blueprint, jsonify
from backend.db import query_all, query_one

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/summary", methods=["GET"])
def get_dashboard_summary():
    """Retrieve overall system counters and summary metrics."""
    teams_cnt = query_one("SELECT COUNT(*) AS total FROM Teams")["total"]
    players_cnt = query_one("SELECT COUNT(*) AS total FROM Players")["total"]
    matches_cnt = query_one("SELECT COUNT(*) AS total FROM Matches")["total"]
    completed_cnt = query_one("SELECT COUNT(*) AS total FROM Matches WHERE winner_id IS NOT NULL")["total"]
    pending_cnt = query_one("SELECT COUNT(*) AS total FROM Matches WHERE winner_id IS NULL")["total"]

    # Aggregates across season
    batting_totals = query_one("""
        SELECT 
            COALESCE(SUM(runs), 0) AS total_runs,
            COALESCE(SUM(fours), 0) AS total_fours,
            COALESCE(SUM(sixes), 0) AS total_sixes
        FROM BattingSeason
    """)
    bowling_totals = query_one("""
        SELECT COALESCE(SUM(wickets), 0) AS total_wickets FROM BowlingSeason
    """)

    return jsonify({
        "success": True,
        "data": {
            "total_teams": teams_cnt,
            "total_players": players_cnt,
            "total_matches": matches_cnt,
            "completed_matches": completed_cnt,
            "pending_matches": pending_cnt,
            "total_runs": int(batting_totals["total_runs"]),
            "total_fours": int(batting_totals["total_fours"]),
            "total_sixes": int(batting_totals["total_sixes"]),
            "total_wickets": int(bowling_totals["total_wickets"])
        }
    })

@dashboard_bp.route("/top-scorers", methods=["GET"])
def get_top_scorers():
    """Retrieve top run scorers."""
    sql = """
        SELECT 
            p.player_id,
            p.player_name,
            t.team_id,
            t.team_name,
            t.team_code,
            b.runs,
            b.balls_faced,
            b.fours,
            b.sixes,
            b.batting_average,
            b.strike_rate
        FROM BattingSeason b
        JOIN Players p ON b.player_id = p.player_id
        JOIN Teams t ON p.team_id = t.team_id
        ORDER BY b.runs DESC
        LIMIT 5
    """
    scorers = query_all(sql)
    return jsonify({"success": True, "data": scorers})

@dashboard_bp.route("/top-wicket-takers", methods=["GET"])
def get_top_wicket_takers():
    """Retrieve top wicket takers."""
    sql = """
        SELECT 
            p.player_id,
            p.player_name,
            t.team_id,
            t.team_name,
            t.team_code,
            bw.wickets,
            bw.economy_rate
        FROM BowlingSeason bw
        JOIN Players p ON bw.player_id = p.player_id
        JOIN Teams t ON p.team_id = t.team_id
        ORDER BY bw.wickets DESC, bw.economy_rate ASC
        LIMIT 5
    """
    wickets = query_all(sql)
    return jsonify({"success": True, "data": wickets})

@dashboard_bp.route("/strike-rate-leaders", methods=["GET"])
def get_strike_rate_leaders():
    """Retrieve highest batting strike rates."""
    sql = """
        SELECT 
            p.player_id,
            p.player_name,
            t.team_id,
            t.team_name,
            t.team_code,
            b.runs,
            b.balls_faced,
            b.strike_rate
        FROM BattingSeason b
        JOIN Players p ON b.player_id = p.player_id
        JOIN Teams t ON p.team_id = t.team_id
        WHERE b.balls_faced >= 50
        ORDER BY b.strike_rate DESC
        LIMIT 5
    """
    leaders = query_all(sql)
    return jsonify({"success": True, "data": leaders})

@dashboard_bp.route("/recent-results", methods=["GET"])
def get_recent_results():
    """Retrieve recently completed matches."""
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
            w.team_code AS winner_code
        FROM Matches m
        JOIN Teams t1 ON m.team1_id = t1.team_id
        JOIN Teams t2 ON m.team2_id = t2.team_id
        LEFT JOIN Teams w ON m.winner_id = w.team_id
        WHERE m.winner_id IS NOT NULL
        ORDER BY m.match_date DESC, m.match_number DESC
        LIMIT 5
    """
    recent = query_all(sql)
    return jsonify({"success": True, "data": recent})

@dashboard_bp.route("/pending-matches", methods=["GET"])
def get_pending_matches():
    """Retrieve matches awaiting results."""
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
            t2.team_code AS team2_code
        FROM Matches m
        JOIN Teams t1 ON m.team1_id = t1.team_id
        JOIN Teams t2 ON m.team2_id = t2.team_id
        WHERE m.winner_id IS NULL
        ORDER BY m.match_date ASC, m.match_number ASC
    """
    pending = query_all(sql)
    return jsonify({"success": True, "data": pending})

@dashboard_bp.route("/team-standings", methods=["GET"])
def get_team_standings():
    """Retrieve team standings based on match wins."""
    sql = """
        SELECT 
            t.team_id,
            t.team_name,
            t.team_code,
            (SELECT COUNT(*) FROM Matches m WHERE (m.team1_id = t.team_id OR m.team2_id = t.team_id) AND m.winner_id IS NOT NULL) AS played,
            (SELECT COUNT(*) FROM Matches m WHERE m.winner_id = t.team_id) AS wins,
            (SELECT COUNT(*) FROM Matches m WHERE (m.team1_id = t.team_id OR m.team2_id = t.team_id) AND m.winner_id IS NOT NULL AND m.winner_id != t.team_id) AS losses,
            (SELECT COUNT(*) FROM Matches m WHERE (m.team1_id = t.team_id OR m.team2_id = t.team_id) AND m.winner_id IS NULL) AS pending
        FROM Teams t
        ORDER BY wins DESC, played ASC, t.team_name ASC
    """
    standings = query_all(sql)
    for s in standings:
        p = s["played"]
        w = s["wins"]
        s["win_percentage"] = round((w / p * 100), 1) if p > 0 else 0.0
        s["points"] = w * 2
    return jsonify({"success": True, "data": standings})

@dashboard_bp.route("/charts", methods=["GET"])
def get_dashboard_charts():
    """Retrieve team aggregates for interactive charts."""
    # Team runs & wickets
    sql = """
        SELECT 
            t.team_id,
            t.team_name,
            t.team_code,
            COALESCE(SUM(b.runs), 0) AS total_runs,
            COALESCE(SUM(bw.wickets), 0) AS total_wickets,
            COALESCE(SUM(b.sixes), 0) AS total_sixes,
            COALESCE(SUM(b.fours), 0) AS total_fours
        FROM Teams t
        LEFT JOIN Players p ON t.team_id = p.team_id
        LEFT JOIN BattingSeason b ON p.player_id = b.player_id
        LEFT JOIN BowlingSeason bw ON p.player_id = bw.player_id
        GROUP BY t.team_id, t.team_name, t.team_code
        ORDER BY total_runs DESC
    """
    team_data = query_all(sql)
    return jsonify({"success": True, "data": team_data})
