import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from backend.config import Config
from backend.db import check_db_health
from backend.routes import register_blueprints

def create_app(config_class=Config):
    # Frontend build folder path
    dist_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

    app = Flask(__name__, static_folder=dist_folder, static_url_path="/")
    app.config.from_object(config_class)

    # Enable Cross-Origin Resource Sharing
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register API Blueprints
    register_blueprints(app)

    # Health Check Endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_health = check_db_health()
        status_code = 200 if db_health["status"] == "healthy" else 503
        return jsonify({
            "status": "online" if db_health["status"] == "healthy" else "degraded",
            "app": "CricketVerse IPL Analytics Platform",
            "version": "1.0.0",
            "database": db_health
        }), status_code

    # Static Frontend Serving for standalone & multi-device deployment
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api/"):
            return jsonify({"success": False, "error": "API route not found."}), 404

        if os.path.exists(os.path.join(dist_folder, path)) and path != "":
            return send_from_directory(dist_folder, path)
        elif os.path.exists(os.path.join(dist_folder, "index.html")):
            return send_from_directory(dist_folder, "index.html")
        else:
            return jsonify({
                "message": "CricketVerse Flask API is running.",
                "docs": "/api/health",
                "frontend": "Frontend build not detected in frontend/dist. Start frontend with 'npm run dev' or build with 'npm run build'."
            })

    # Centralized Error Handlers
    @app.errorhandler(404)
    def handle_not_found(e):
        if request.path.startswith("/api/"):
            return jsonify({"success": False, "error": "Requested API endpoint not found."}), 404
        return e

    @app.errorhandler(400)
    def handle_bad_request(e):
        return jsonify({"success": False, "error": str(e.description if hasattr(e, 'description') else "Bad request.")}), 400

    @app.errorhandler(500)
    def handle_server_error(e):
        return jsonify({"success": False, "error": "An internal server error occurred. Please try again later."}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("FLASK_PORT", 5000))
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    print(f"Starting CricketVerse API server on http://{host}:{port} ...")
    app.run(host=host, port=port, debug=True)
