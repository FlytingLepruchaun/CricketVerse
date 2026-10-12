from flask import Blueprint, jsonify, request
from backend.db import query_all, query_one

matches_bp = Blueprint("matches", __name__, url_prefix="/api/matches")

@matches_bp.route("", methods=["GET"])
def get_matches():
    """Retrieve matches with filtering, searching, and pagination."""
    team_id = request.args.get("team_id", type=int)
    venue = request.args.get("venue", "").strip()
    status = request.args.get("status", "all").lower()  # all, completed, pending
    search = request.args.get("search", "").strip()
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()
    order = request.args.get("order", "asc").lower()
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)

    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 20

    where_clauses = ["1=1"]
    params = []

    if status == "completed":
        where_clauses.append("m.winner_id IS NOT NULL")
    elif status == "pending":
        where_clauses.append("m.winner_id IS NULL")

    if team_id:
        where_clauses.append("(m.team1_id = %s OR m.team2_id = %s)")
        params.extend([team_id, team_id])

    if venue:
        where_clauses.append("m.venue LIKE %s")
        params.append(f"%{venue}%")

    if start_date:
        where_clauses.append("m.match_date >= %s")
        params.append(start_date)

    if end_date:
        where_clauses.append("m.match_date <= %s")
        params.append(end_date)

    if search:
        # Match number or team names
        if search.isdigit():
            where_clauses.append("(m.match_number = %s OR t1.team_name LIKE %s OR t2.team_name LIKE %s)")
            params.extend([int(search), f"%{search}%", f"%{search}%"])
        else:
            where_clauses.append("(t1.team_name LIKE %s OR t2.team_name LIKE %s OR t1.team_code LIKE %s OR t2.team_code LIKE %s)")
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%", f"%{search}%"])

    where_sql = " AND ".join(where_clauses)
    sort_dir = "DESC" if order == "desc" else "ASC"

    # Count query
    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM Matches m
        JOIN Teams t1 ON m.team1_id = t1.team_id
        JOIN Teams t2 ON m.team2_id = t2.team_id
        LEFT JOIN Teams w ON m.winner_id = w.team_id
        WHERE {where_sql}
    """
    total = query_one(count_sql, tuple(params))["total"]
    offset = (page - 1) * limit

    data_sql = f"""
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
                WHEN m.winner_id IS NULL THEN 'Result Pending'
                ELSE 'Completed'
            END AS status
        FROM Matches m
        JOIN Teams t1 ON m.team1_id = t1.team_id
        JOIN Teams t2 ON m.team2_id = t2.team_id
        LEFT JOIN Teams w ON m.winner_id = w.team_id
        WHERE {where_sql}
        ORDER BY m.match_date {sort_dir}, m.match_number {sort_dir}
        LIMIT %s OFFSET %s
    """
    query_params = list(params) + [limit, offset]
    matches = query_all(data_sql, tuple(query_params))

    return jsonify({
        "success": True,
        "data": matches,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    })

@matches_bp.route("/<int:match_number>", methods=["GET"])
def get_match_detail(match_number):
    """Retrieve details for a single match."""
    sql = """
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
                WHEN m.winner_id IS NULL THEN 'Result Pending'
                ELSE 'Completed'
            END AS status
        FROM Matches m
        JOIN Teams t1 ON m.team1_id = t1.team_id
        JOIN Teams t2 ON m.team2_id = t2.team_id
        LEFT JOIN Teams w ON m.winner_id = w.team_id
        WHERE m.match_number = %s
    """
    match = query_one(sql, (match_number,))
    if not match:
        return jsonify({"success": False, "error": f"Match #{match_number} not found."}), 404

    return jsonify({"success": True, "data": match})

@matches_bp.route("/pending", methods=["GET"])
def get_pending_matches():
    """Retrieve matches with pending results."""
    sql = """
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
            t1.team_id AS team1_id,
            t1.team_name AS team1_name,
            t1.team_code AS team1_code,
            t2.team_id AS team2_id,
            t2.team_name AS team2_name,
            t2.team_code AS team2_code,
            'Result Pending' AS status
        FROM Matches m
        JOIN Teams t1 ON m.team1_id = t1.team_id
        JOIN Teams t2 ON m.team2_id = t2.team_id
        WHERE m.winner_id IS NULL
        ORDER BY m.match_date ASC, m.match_number ASC
    """
    return jsonify({"success": True, "data": query_all(sql)})

@matches_bp.route("/completed", methods=["GET"])
def get_completed_matches():
    """Retrieve completed matches."""
    sql = """
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
            t1.team_id AS team1_id,
            t1.team_name AS team1_name,
            t1.team_code AS team1_code,
            t2.team_id AS team2_id,
            t2.team_name AS team2_name,
            t2.team_code AS team2_code,
            w.team_id AS winner_id,
            w.team_name AS winner_name,
            w.team_code AS winner_code,
            'Completed' AS status
        FROM Matches m
        JOIN Teams t1 ON m.team1_id = t1.team_id
        JOIN Teams t2 ON m.team2_id = t2.team_id
        JOIN Teams w ON m.winner_id = w.team_id
        ORDER BY m.match_date DESC, m.match_number DESC
    """
    return jsonify({"success": True, "data": query_all(sql)})

@matches_bp.route("/venues", methods=["GET"])
def get_venues():
    """Retrieve distinct venues list."""
    sql = "SELECT DISTINCT venue FROM Matches WHERE venue IS NOT NULL AND venue != '' ORDER BY venue ASC"
    venues = query_all(sql)
    return jsonify({"success": True, "data": [v["venue"] for v in venues]})
