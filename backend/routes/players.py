from flask import Blueprint, jsonify, request
from backend.db import query_all, query_one

players_bp = Blueprint("players", __name__, url_prefix="/api/players")

# Allowlist for safe sorting to prevent SQL injection
ALLOWED_SORT_FIELDS = {
    "runs": "b.runs",
    "batting_average": "b.batting_average",
    "strike_rate": "b.strike_rate",
    "wickets": "bw.wickets",
    "economy_rate": "bw.economy_rate",
    "fours": "b.fours",
    "sixes": "b.sixes",
    "player_name": "p.player_name",
    "player_id": "p.player_id"
}

@players_bp.route("", methods=["GET"])
def get_players():
    """Retrieve players with search, team filtering, sorting, and pagination."""
    search = request.args.get("search", "").strip()
    team_id = request.args.get("team_id", type=int)
    team_code = request.args.get("team_code", "").strip()
    sort_by = request.args.get("sort_by", "runs")
    order = request.args.get("order", "desc").lower()
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)

    if page < 1:
        page = 1
    if limit < 1 or limit > 150:
        limit = 20

    sort_col = ALLOWED_SORT_FIELDS.get(sort_by, "b.runs")
    sort_dir = "ASC" if order == "asc" else "DESC"

    where_clauses = ["1=1"]
    params = []

    if search:
        where_clauses.append("p.player_name LIKE %s")
        params.append(f"%{search}%")

    if team_id:
        where_clauses.append("p.team_id = %s")
        params.append(team_id)

    if team_code:
        where_clauses.append("t.team_code = %s")
        params.append(team_code)

    where_sql = " AND ".join(where_clauses)

    # Count total matching
    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM Players p
        JOIN Teams t ON p.team_id = t.team_id
        LEFT JOIN BattingSeason b ON p.player_id = b.player_id
        LEFT JOIN BowlingSeason bw ON p.player_id = bw.player_id
        WHERE {where_sql}
    """
    total_records = query_one(count_sql, tuple(params))["total"]

    offset = (page - 1) * limit

    # Query paginated rows
    # When sorting by bowling economy rate ASC, put NULLs at the end
    order_clause = f"{sort_col} {sort_dir}"
    if sort_by in ("economy_rate", "wickets"):
        order_clause = f"({sort_col} IS NULL), {sort_col} {sort_dir}"

    data_sql = f"""
        SELECT 
            p.player_id,
            p.player_name,
            p.team_id,
            t.team_name,
            t.team_code,
            -- Batting
            b.runs,
            b.balls_faced,
            b.fours,
            b.sixes,
            b.batting_average,
            b.strike_rate,
            -- Bowling
            bw.wickets,
            bw.economy_rate
        FROM Players p
        JOIN Teams t ON p.team_id = t.team_id
        LEFT JOIN BattingSeason b ON p.player_id = b.player_id
        LEFT JOIN BowlingSeason bw ON p.player_id = bw.player_id
        WHERE {where_sql}
        ORDER BY {order_clause}, p.player_name ASC
        LIMIT %s OFFSET %s
    """
    query_params = list(params) + [limit, offset]
    players = query_all(data_sql, tuple(query_params))

    return jsonify({
        "success": True,
        "data": players,
        "pagination": {
            "total": total_records,
            "page": page,
            "limit": limit,
            "total_pages": (total_records + limit - 1) // limit
        }
    })

@players_bp.route("/<int:player_id>", methods=["GET"])
def get_player_profile(player_id):
    """Retrieve detailed player statistics and calculated metrics."""
    sql = """
        SELECT 
            p.player_id,
            p.player_name,
            p.team_id,
            t.team_name,
            t.team_code,
            -- Batting
            b.runs,
            b.balls_faced,
            b.fours,
            b.sixes,
            b.batting_average,
            b.strike_rate,
            -- Bowling
            bw.wickets,
            bw.economy_rate
        FROM Players p
        JOIN Teams t ON p.team_id = t.team_id
        LEFT JOIN BattingSeason b ON p.player_id = b.player_id
        LEFT JOIN BowlingSeason bw ON p.player_id = bw.player_id
        WHERE p.player_id = %s
    """
    player = query_one(sql, (player_id,))
    if not player:
        return jsonify({"success": False, "error": f"Player with ID {player_id} not found."}), 404

    # Calculate additional metrics safely
    runs = player.get("runs") or 0
    fours = player.get("fours") or 0
    sixes = player.get("sixes") or 0
    boundary_runs = (fours * 4) + (sixes * 6)
    boundary_pct = round((boundary_runs / runs * 100), 2) if runs > 0 else 0.0

    # Batting rank across tournament
    run_rank_res = query_one("""
        SELECT COUNT(*) + 1 AS `rank` FROM BattingSeason WHERE runs > (
            SELECT COALESCE(runs, 0) FROM BattingSeason WHERE player_id = %s
        )
    """, (player_id,))
    run_rank = run_rank_res["rank"] if player.get("runs") is not None else None

    # Bowling rank across tournament
    wicket_rank = None
    if player.get("wickets") is not None:
        wicket_rank_res = query_one("""
            SELECT COUNT(*) + 1 AS `rank` FROM BowlingSeason WHERE wickets > (
                SELECT COALESCE(wickets, 0) FROM BowlingSeason WHERE player_id = %s
            )
        """, (player_id,))
        wicket_rank = wicket_rank_res["rank"]

    player["metrics"] = {
        "boundary_runs": boundary_runs,
        "boundary_percentage": boundary_pct,
        "runs_rank": run_rank,
        "wickets_rank": wicket_rank,
        "has_batting": player.get("runs") is not None,
        "has_bowling": player.get("wickets") is not None
    }

    return jsonify({"success": True, "data": player})

@players_bp.route("/top-scorers", methods=["GET"])
def get_top_scorers():
    """Retrieve top run scorers with optional limit."""
    limit = request.args.get("limit", 10, type=int)
    sql = """
        SELECT 
            p.player_id,
            p.player_name,
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
        LIMIT %s
    """
    return jsonify({"success": True, "data": query_all(sql, (limit,))})

@players_bp.route("/top-wicket-takers", methods=["GET"])
def get_top_wicket_takers():
    """Retrieve top wicket takers with optional limit."""
    limit = request.args.get("limit", 10, type=int)
    sql = """
        SELECT 
            p.player_id,
            p.player_name,
            t.team_name,
            t.team_code,
            bw.wickets,
            bw.economy_rate
        FROM BowlingSeason bw
        JOIN Players p ON bw.player_id = p.player_id
        JOIN Teams t ON p.team_id = t.team_id
        ORDER BY bw.wickets DESC, bw.economy_rate ASC
        LIMIT %s
    """
    return jsonify({"success": True, "data": query_all(sql, (limit,))})

@players_bp.route("/compare", methods=["GET"])
def compare_players():
    """Compare two players side by side."""
    p1_id = request.args.get("player1", type=int)
    p2_id = request.args.get("player2", type=int)

    if not p1_id or not p2_id:
        return jsonify({"success": False, "error": "Both 'player1' and 'player2' query parameters are required."}), 400

    def get_single(pid):
        return query_one("""
            SELECT 
                p.player_id,
                p.player_name,
                p.team_id,
                t.team_name,
                t.team_code,
                b.runs,
                b.balls_faced,
                b.fours,
                b.sixes,
                b.batting_average,
                b.strike_rate,
                bw.wickets,
                bw.economy_rate
            FROM Players p
            JOIN Teams t ON p.team_id = t.team_id
            LEFT JOIN BattingSeason b ON p.player_id = b.player_id
            LEFT JOIN BowlingSeason bw ON p.player_id = bw.player_id
            WHERE p.player_id = %s
        """, (pid,))

    p1 = get_single(p1_id)
    p2 = get_single(p2_id)

    if not p1:
        return jsonify({"success": False, "error": f"Player {p1_id} not found."}), 404
    if not p2:
        return jsonify({"success": False, "error": f"Player {p2_id} not found."}), 404

    # Determine comparison leaders
    def leader(val1, val2, higher_is_better=True):
        if val1 is None and val2 is None:
            return "tie"
        if val1 is None:
            return "player2"
        if val2 is None:
            return "player1"
        if val1 == val2:
            return "tie"
        if higher_is_better:
            return "player1" if val1 > val2 else "player2"
        else:
            return "player1" if val1 < val2 else "player2"

    comparison = {
        "runs": leader(p1.get("runs"), p2.get("runs"), True),
        "balls_faced": leader(p1.get("balls_faced"), p2.get("balls_faced"), True),
        "batting_average": leader(p1.get("batting_average"), p2.get("batting_average"), True),
        "strike_rate": leader(p1.get("strike_rate"), p2.get("strike_rate"), True),
        "fours": leader(p1.get("fours"), p2.get("fours"), True),
        "sixes": leader(p1.get("sixes"), p2.get("sixes"), True),
        "wickets": leader(p1.get("wickets"), p2.get("wickets"), True),
        "economy_rate": leader(p1.get("economy_rate"), p2.get("economy_rate"), False)
    }

    return jsonify({
        "success": True,
        "data": {
            "player1": p1,
            "player2": p2,
            "leaders": comparison
        }
    })
