from flask import Blueprint, jsonify, request
from backend.db import query_all

search_bp = Blueprint("search", __name__, url_prefix="/api/search")

@search_bp.route("", methods=["GET"])
def global_search():
    """Perform multi-entity search across Teams, Players, and Matches."""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({
            "success": True,
            "data": {
                "teams": [],
                "players": [],
                "matches": []
            }
        })

    param = f"%{query}%"

    # Search Teams
    teams_sql = """
        SELECT team_id, team_name, team_code
        FROM Teams
        WHERE team_name LIKE %s OR team_code LIKE %s
        ORDER BY team_name ASC
        LIMIT 5
    """
    teams = query_all(teams_sql, (param, param))

    # Search Players
    players_sql = """
        SELECT 
            p.player_id, 
            p.player_name, 
            t.team_name, 
            t.team_code,
            COALESCE(b.runs, 0) AS runs,
            bw.wickets
        FROM Players p
        JOIN Teams t ON p.team_id = t.team_id
        LEFT JOIN BattingSeason b ON p.player_id = b.player_id
        LEFT JOIN BowlingSeason bw ON p.player_id = bw.player_id
        WHERE p.player_name LIKE %s
        ORDER BY b.runs DESC, p.player_name ASC
        LIMIT 8
    """
    players = query_all(players_sql, (param,))

    # Search Matches
    matches_sql = """
        SELECT 
            m.match_number,
            m.match_date,
            m.venue,
            m.team1_runs,
            m.team1_overs,
            m.team1_wickets_lost,
            m.team2_runs,
            m.team2_overs,
            m.team2_wickets_lost,
            m.winning_margin,
            m.winning_margin_type,
            t1.team_code AS team1_code,
            t1.team_name AS team1_name,
            t2.team_code AS team2_code,
            t2.team_name AS team2_name,
            w.team_code AS winner_code,
            w.team_name AS winner_name
        FROM Matches m
        JOIN Teams t1 ON m.team1_id = t1.team_id
        JOIN Teams t2 ON m.team2_id = t2.team_id
        LEFT JOIN Teams w ON m.winner_id = w.team_id
        WHERE m.venue LIKE %s 
           OR t1.team_name LIKE %s 
           OR t2.team_name LIKE %s
           OR t1.team_code LIKE %s 
           OR t2.team_code LIKE %s
           OR CAST(m.match_number AS CHAR) = %s
        ORDER BY m.match_date ASC
        LIMIT 5
    """
    matches = query_all(matches_sql, (param, param, param, param, param, query))

    return jsonify({
        "success": True,
        "query": query,
        "data": {
            "teams": teams,
            "players": players,
            "matches": matches
        }
    })
