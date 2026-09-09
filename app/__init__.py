from flask import Flask, jsonify
from app.extensions import db, migrate


def create_app(config_class=None):
    app = Flask(__name__)

    if config_class is None:
        from app.config import Config
        config_class = Config

    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)

    # Register Core Models
    from app.core import models as core_models

    # Register Finance Models
    from app.modules.finance import models as finance_models

    # Register Error Handlers
    from app.core.handlers import register_error_handlers
    register_error_handlers(app)

    # Register Finance Blueprint
    from app.modules.finance.routes import finance_bp
    app.register_blueprint(
        finance_bp,
        url_prefix="/api/v1/finance"
    )

    # Health check
    @app.route("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    return app