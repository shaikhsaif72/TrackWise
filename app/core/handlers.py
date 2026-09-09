from flask import jsonify
from marshmallow import ValidationError
from app.core.exceptions import APIException

def register_error_handlers(app):
    """Registers centralized global JSON error handlers."""
    
    @app.errorhandler(APIException)
    def handle_api_exception(e):
        details = getattr(e, 'details', None)
        return jsonify({
            "error": {
                "message": e.message,
                "details": details
            }
        }), e.status_code

    @app.errorhandler(ValidationError)
    def handle_validation_error(e):
        return jsonify({
            "error": {
                "message": "Validation failed",
                "details": e.messages
            }
        }), 400

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({
            "error": {
                "message": "Resource not found",
                "details": None
            }
        }), 404

    @app.errorhandler(500)
    def handle_internal_server_error(e):
        return jsonify({
            "error": {
                "message": "Internal Server Error",
                "details": None
            }
        }), 500