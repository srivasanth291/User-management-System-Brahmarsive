from functools import wraps

import jwt
from flask import request, jsonify, g
from sqlalchemy import select

from shared.database import SessionLocal
from shared.models.user import User
from shared.security import decode_access_token


def login_required(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        authorization = request.headers.get(
            "Authorization", ""
        )

        scheme, _, token = authorization.partition(" ")

        if scheme.lower() != "bearer" or not token:
            return jsonify({
                "message": "Authentication required"
            }), 401

        try:
            user_id = decode_access_token(token)

        except (jwt.InvalidTokenError, ValueError):
            return jsonify({
                "message": "Invalid or expired token"
            }), 401

        with SessionLocal() as db:
            user = db.scalar(
                select(User).where(User.id == user_id)
            )

            if user is None or not user.is_active:
                return jsonify({
                    "message": "User not found or inactive"
                }), 401

            g.current_user = {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value
            }

        return function(*args, **kwargs)

    return wrapper
