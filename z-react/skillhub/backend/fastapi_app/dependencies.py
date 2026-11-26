from collections.abc import Callable
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.models.user import User
from shared.security import decode_access_token


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db)
) -> User:

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    try:
        user_id = decode_access_token(
            credentials.credentials
        )

    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user = db.scalar(
        select(User).where(User.id == user_id)
    )

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return user



def require_roles(
    *allowed_roles: str
) -> Callable:

    def check_role(
        user: User = Depends(get_current_user)
    ) -> User:

        if user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied"
            )

        return user

    return check_role

STAFF_PERMISSIONS = frozenset({
    "create_course",
    "edit_course",
    "publish_course",
    "manage_modules",
    "view_students",
    "add_student",
    "assign_course",
    "unassign_course",
    "view_progress",
})


def has_permission(user: User, permission: str) -> bool:
    if user.role.value == "admin":
        return True

    if user.role.value != "staff":
        return False

    return permission in (user.permissions or [])


def check_permission(user: User, permission: str) -> None:
    if not has_permission(user, permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission required: {permission}"
        )


def require_permission(permission: str):
    def dependency(
        user: User = Depends(get_current_user)
    ) -> User:
        check_permission(user, permission)
        return user

    return dependency