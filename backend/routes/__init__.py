from backend.routes.dashboard import dashboard_bp
from backend.routes.teams import teams_bp
from backend.routes.players import players_bp
from backend.routes.matches import matches_bp
from backend.routes.stats import stats_bp
from backend.routes.search import search_bp
from backend.routes.admin import admin_bp

def register_blueprints(app):
    """Register all route blueprints with Flask app."""
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(teams_bp)
    app.register_blueprint(players_bp)
    app.register_blueprint(matches_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(admin_bp)
