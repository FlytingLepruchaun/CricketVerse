from flask import Blueprint, jsonify, request
from backend.db import query_all

stats_bp = Blueprint("stats", __name__, url_prefix="/api/stats")

@stats_bp.route("/leaderboards", methods=["GET"])
def get_leaderboards():
    """Retrieve full suite of statistical leaderboards with rankings."""
    limit = request.args.get("limit", 10, type=int)
    if limit < 1 or limit > 50:
        limit = 10

    # 1. Orange Cap (Most Runs)
    orange_cap = query_all("""
        SELECT 
            DENSE_RANK() OVER (ORDER BY b.runs DESC) AS `rank`,
            p.player_id,
            p.player_name,
            t.team_name,
            t.team_code,
            b.runs,
            b.balls_faced,
            b.batting_average,
            b.strike_rate,
            b.fours,
            b.sixes
        FROM BattingSeason b
        JOIN Players p ON b.player_id = p.player_id
        JOIN Teams t ON p.team_id = t.team_id
        ORDER BY b.runs DESC, b.strike_rate DESC
        LIMIT %s
    """, (limit,))

    # 2. Purple Cap (Most Wickets)
    purple_cap = query_all("""
        SELECT 
            DENSE_RANK() OVER (ORDER BY bw.wickets DESC, bw.economy_rate ASC) AS `rank`,
            p.player_id,
            p.player_name,
            t.team_name,
            t.team_code,
            bw.wickets,
            bw.economy_rate
        FROM BowlingSeason bw
        JOIN Players p ON bw.player_id = p.player_id
        JOIN Teams t ON p.team_id = t.team_id
        WHERE bw.wickets > 0
        ORDER BY bw.wickets DESC, bw.economy_rate ASC
        LIMIT %s
    """, (limit,))

    # 3. Highest Batting Average (Min 100 runs)
    highest_avg = query_all("""
        SELECT 
            DENSE_RANK() OVER (ORDER BY b.batting_average DESC) AS `rank`,
            p.player_id,
            p.player_name,
            t.team_name,
            t.team_code,
            b.runs,
            b.batting_average,
            b.strike_rate
        FROM BattingSeason b
        JOIN Players p ON b.player_id = p.player_id
        JOIN Teams t ON p.team_id = t.team_id
        WHERE b.runs >= 100
        ORDER BY b.batting_average DESC, b.runs DESC
        LIMIT %s
    """, (limit,))

    # 4. Highest Batting Strike Rate (Min 50 balls faced)
    highest_sr = query_all("""
        SELECT 
            DENSE_RANK() OVER (ORDER BY b.strike_rate DESC) AS `rank`,
            p.player_id,
            p.player_name,
            t.team_name,
            t.team_code,
            b.runs,
            b.balls_faced,
            b.strike_rate
        FROM BattingSeason b
        JOIN Players p ON b.player_id = p.player_id
        JOIN Teams t ON p.team_id = t.team_id
        WHERE b.balls_faced >= 50
        ORDER BY b.strike_rate DESC, b.runs DESC
        LIMIT %s
    """, (limit,))

    # 5. Most Fours
    most_fours = query_all("""
        SELECT 
            DENSE_RANK() OVER (ORDER BY b.fours DESC) AS `rank`,
            p.player_id,
            p.player_name,
            t.team_name,
            t.team_code,
            b.fours,
            b.runs
        FROM BattingSeason b
        JOIN Players p ON b.player_id = p.player_id
        JOIN Teams t ON p.team_id = t.team_id
        ORDER BY b.fours DESC, b.runs DESC
        LIMIT %s
    """, (limit,))

    # 6. Most Sixes
    most_sixes = query_all("""
        SELECT 
            DENSE_RANK() OVER (ORDER BY b.sixes DESC) AS `rank`,
            p.player_id,
            p.player_name,
            t.team_name,
            t.team_code,
            b.sixes,
            b.runs
        FROM BattingSeason b
        JOIN Players p ON b.player_id = p.player_id
        JOIN Teams t ON p.team_id = t.team_id
        ORDER BY b.sixes DESC, b.runs DESC
        LIMIT %s
    """, (limit,))

    # 7. Best Bowling Economy (Must have bowled and taken wickets, sorted ASC)
    best_economy = query_all("""
        SELECT 
            DENSE_RANK() OVER (ORDER BY bw.economy_rate ASC) AS `rank`,
            p.player_id,
            p.player_name,
            t.team_name,
            t.team_code,
            bw.economy_rate,
            bw.wickets
        FROM BowlingSeason bw
        JOIN Players p ON bw.player_id = p.player_id
        JOIN Teams t ON p.team_id = t.team_id
        WHERE bw.economy_rate IS NOT NULL AND bw.wickets >= 5
        ORDER BY bw.economy_rate ASC, bw.wickets DESC
        LIMIT %s
    """, (limit,))

    return jsonify({
        "success": True,
        "data": {
            "orange_cap": orange_cap,
            "purple_cap": purple_cap,
            "highest_average": highest_avg,
            "highest_strike_rate": highest_sr,
            "most_fours": most_fours,
            "most_sixes": most_sixes,
            "best_economy": best_economy
        }
    })

@stats_bp.route("/teams", methods=["GET"])
def get_team_stats():
    """Retrieve comprehensive team comparisons and aggregates."""
    sql = """
        SELECT 
            t.team_id,
            t.team_name,
            t.team_code,
            COUNT(DISTINCT p.player_id) AS squad_count,
            COALESCE(SUM(b.runs), 0) AS total_runs,
            COALESCE(SUM(b.balls_faced), 0) AS total_balls_faced,
            COALESCE(SUM(b.fours), 0) AS total_fours,
            COALESCE(SUM(b.sixes), 0) AS total_sixes,
            ROUND(AVG(b.strike_rate), 2) AS avg_strike_rate,
            ROUND(AVG(b.batting_average), 2) AS avg_batting_avg,
            COALESCE(SUM(bw.wickets), 0) AS total_wickets,
            ROUND(AVG(bw.economy_rate), 2) AS avg_economy_rate
        FROM Teams t
        LEFT JOIN Players p ON t.team_id = p.team_id
        LEFT JOIN BattingSeason b ON p.player_id = b.player_id
        LEFT JOIN BowlingSeason bw ON p.player_id = bw.player_id
        GROUP BY t.team_id, t.team_name, t.team_code
        ORDER BY total_runs DESC
    """
    team_stats = query_all(sql)
    return jsonify({"success": True, "data": team_stats})
