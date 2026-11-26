from flask import g
from flask_app.auth_guard import login_required
from flask import Blueprint, request, jsonify
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from shared.security import verify_password, create_access_token
from shared.database import SessionLocal
from shared.models.user import User, UserRole
from shared.security import hash_password


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    return jsonify({
        "message": "Registration is invitation-only"
    }), 403

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Valid JSON body required"
        }), 400

    email = data.get("email")
    password = data.get("password")

    if (
        not isinstance(email, str)
        or not isinstance(password, str)
    ):
        return jsonify({
            "message": "Email and password required"
        }), 400

    email = email.strip().lower()

    if not email or not password:
        return jsonify({
            "message": "Email and password required"
        }), 400

    with SessionLocal() as db:
        user = db.scalar(
            select(User).where(User.email == email)
        )

        if user is None:
            return jsonify({
                "message": "Invalid email or password"
            }), 401

        if not verify_password(
            password,
            user.password_hash
        ):
            return jsonify({
                "message": "Invalid email or password"
            }), 401

        if not user.is_active:
            return jsonify({
                "message": "Invalid email or password"
            }), 403

        token = create_access_token(user.id)

        return jsonify({
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value
            }
        }), 200

@auth_bp.route("/me", methods=["GET"])
@login_required
def get_current_user():
    return jsonify({
        "message": "Authenticated user",
        "user": g.current_user
    }), 200
