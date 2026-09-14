import re
from datetime import datetime, timedelta, timezone

import jwt
from flask import Blueprint, current_app, jsonify, request, g
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.core.auth import require_auth
from app.modules.auth.models import User


auth_bp = Blueprint("auth", __name__)


# =========================================================
# REGISTER
# =========================================================

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


# =========================================================
# LOGIN
# =========================================================

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

    if not user or not check_password_hash(
        user.password_hash,
        password
    ):
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


# =========================================================
# GET CURRENT USER PROFILE
# =========================================================

@auth_bp.route("/profile", methods=["GET"])
@require_auth
def get_profile():
    user = User.query.get(g.user_id)

    if not user:
        return jsonify({
            "message": "User not found."
        }), 404

    return jsonify({
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email
        }
    }), 200


# =========================================================
# UPDATE USER PROFILE
# =========================================================

@auth_bp.route("/profile", methods=["PATCH"])
@require_auth
def update_profile():
    data = request.get_json() or {}

    user = User.query.get(g.user_id)

    if not user:
        return jsonify({
            "message": "User not found."
        }), 404

    name = data.get("name")
    email = data.get("email")

    # Update name if provided
    if name is not None:
        name = name.strip()

        if len(name) < 2:
            return jsonify({
                "message": "Name must be at least 2 characters."
            }), 400

        user.name = name

    # Update email if provided
    if email is not None:
        email = email.strip().lower()

        if not email:
            return jsonify({
                "message": "Email cannot be empty."
            }), 400

        existing_user = User.query.filter(
            User.email == email,
            User.id != user.id
        ).first()

        if existing_user:
            return jsonify({
                "message": "Email already registered."
            }), 409

        user.email = email

    db.session.commit()

    return jsonify({
        "message": "Profile updated successfully.",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email
        }
    }), 200


# =========================================================
# CHANGE PASSWORD
# =========================================================

@auth_bp.route("/change-password", methods=["POST"])
@require_auth
def change_password():
    data = request.get_json() or {}

    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password or not new_password:
        return jsonify({
            "message": "Current password and new password are required."
        }), 400

    if len(new_password) < 8:
        return jsonify({
            "message": "New password must be at least 8 characters."
        }), 400

    if not re.search(r"[A-Z]", new_password):
        return jsonify({
            "message": (
                "New password must contain at least one uppercase letter."
            )
        }), 400

    if not re.search(r"[a-z]", new_password):
        return jsonify({
            "message": (
                "New password must contain at least one lowercase letter."
            )
        }), 400

    if not re.search(r"[0-9]", new_password):
        return jsonify({
            "message": (
                "New password must contain at least one number."
            )
        }), 400

    if not re.search(r"[^A-Za-z0-9\s]", new_password):
        return jsonify({
            "message": (
                "New password must contain at least one special character."
            )
        }), 400

    user = User.query.get(g.user_id)

    if not user:
        return jsonify({
            "message": "User not found."
        }), 404

    if not check_password_hash(
        user.password_hash,
        current_password
    ):
        return jsonify({
            "message": "Current password is incorrect."
        }), 401

    if check_password_hash(
        user.password_hash,
        new_password
    ):
        return jsonify({
            "message": (
                "New password must be different from current password."
            )
        }), 400

    user.password_hash = generate_password_hash(new_password)

    db.session.commit()

    return jsonify({
        "message": "Password changed successfully."
    }), 200