import uuid
from datetime import datetime, timedelta, timezone

import re
import jwt
from flask import Blueprint, current_app, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.modules.auth.models import User


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "message": "Name, email and password are required."
        }), 400

    if len(name) < 2:
        return jsonify({
            "message": "Name must be at least 2 characters."
        }), 400

    if len(password) < 8:
        return jsonify({
            "message": "Password must be at least 8 characters."
        }), 400

    if not re.search(r"[A-Z]", password):
        return jsonify({
            "message": "Password must contain at least one uppercase letter."
        }), 400

    if not re.search(r"[a-z]", password):
        return jsonify({
            "message": "Password must contain at least one lowercase letter."
        }), 400

    if not re.search(r"[0-9]", password):
        return jsonify({
            "message": "Password must contain at least one number."
        }), 400

    if not re.search(r"[^A-Za-z0-9\s]", password):
        return jsonify({
            "message": "Password must contain at least one special character."
        }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "message": "Email already registered."
        }), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password)
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Registration successful.",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required."
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({
            "message": "Invalid email or password."
        }), 401

    if not user.is_active:
        return jsonify({
            "message": "Account is inactive."
        }), 403

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user.id),
        "iat": now,
        "exp": now + timedelta(days=7)
    }

    token = jwt.encode(
        payload,
        current_app.config["AUTH_SECRET_KEY"],
        algorithm=current_app.config.get("JWT_ALGORITHM", "HS256")
    )

    return jsonify({
        "message": "Login successful.",
        "access_token": token,
        "token": token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email
        }
    }), 200