from functools import wraps

import jwt
from flask import Blueprint, current_app, g, jsonify, request


def require_auth(function):
    @wraps(function)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({
                "message": "Authorization token is required."
            }), 401

        token = auth_header.split(" ", 1)[1].strip()

        if not token:
            return jsonify({
                "message": "Authorization token is required."
            }), 401

        try:
            decoded_token = jwt.decode(
                token,
                current_app.config["AUTH_SECRET_KEY"],
                algorithms=[
                    current_app.config.get("JWT_ALGORITHM", "HS256")
                ]
            )

            user_id = decoded_token.get("sub")

            if not user_id:
                return jsonify({
                    "message": "Invalid authorization token."
                }), 401

            # Store logged-in user's ID for protected routes
            g.user_id = user_id

        except jwt.ExpiredSignatureError:
            return jsonify({
                "message": "Authorization token has expired."
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                "message": "Invalid authorization token."
            }), 401

        return function(*args, **kwargs)

    return decorated_function