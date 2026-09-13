from flask import Flask, jsonify
from flask_cors import CORS

from app.extensions import db, migrate


def create_app(config_class=None):
    app = Flask(__name__)

    # --------------------------------------------------
    # CONFIGURATION
    # --------------------------------------------------

    if config_class is None:
        from app.config import Config
        config_class = Config

    app.config.from_object(config_class)

    # --------------------------------------------------
    # CORS CONFIGURATION
    # --------------------------------------------------

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                ]
            }
        },
        supports_credentials=True,
        methods=[
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        allow_headers=[
            "Content-Type",
            "Authorization",
        ],
    )

    # --------------------------------------------------
    # DATABASE AND MIGRATIONS
    # --------------------------------------------------

    db.init_app(app)
    migrate.init_app(app, db)

    # --------------------------------------------------
    # REGISTER CORE MODELS
    # --------------------------------------------------

    from app.core import models as core_models

    # --------------------------------------------------
    # REGISTER FINANCE MODELS
    # --------------------------------------------------

    from app.modules.finance import models as finance_models

    # --------------------------------------------------
    # REGISTER AUTH MODELS
    # --------------------------------------------------

    from app.modules.auth import models as auth_models

    # --------------------------------------------------
    # REGISTER ERROR HANDLERS
    # --------------------------------------------------

    from app.core.handlers import register_error_handlers

    register_error_handlers(app)

    # --------------------------------------------------
    # REGISTER FINANCE BLUEPRINT
    # --------------------------------------------------

    from app.modules.finance.routes import finance_bp

    app.register_blueprint(finance_bp)

    # --------------------------------------------------
    # REGISTER AUTH BLUEPRINT
    # --------------------------------------------------

    from app.modules.auth.routes import auth_bp

    app.register_blueprint(
        auth_bp,
        url_prefix="/api/v1/auth",
    )

    # --------------------------------------------------
    # HEALTH CHECK
    # --------------------------------------------------

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "ok"
        }), 200

    return app