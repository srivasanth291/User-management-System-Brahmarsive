
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.models.user import User, UserRole
from fastapi_app.dependencies import (
    get_current_user,
    require_roles
)


router = APIRouter(
    prefix="/api/users",
    tags=["User Management"]
)


class UserUpdate(BaseModel):
    name: str | None = Field(
        default=None, min_length=2, max_length=150
    )
    email: EmailStr | None = None
    isActive: bool | None = None


def serialize_user(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role.value,
        "isActive": user.is_active,
        "createdAt": (
            user.created_at.isoformat()
            if user.created_at else None
        )
    }


@router.get("")
def list_users(
    role: Literal["admin", "staff", "student"] | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "staff")
    )
):
    conditions = []

    if current_user.role == UserRole.STAFF:
        if role is not None and role != "student":
            raise HTTPException(
                403, "Staff can view students only"
            )
        conditions.append(User.role == UserRole.STUDENT)

    elif role:
        conditions.append(User.role == UserRole(role))

    if search:
        term = f"%{search.strip()}%"
        conditions.append(
            User.name.ilike(term) |
            User.email.ilike(term)
        )

    total = db.scalar(
        select(func.count(User.id)).where(*conditions)
    ) or 0

    users = db.scalars(
        select(User)
        .where(*conditions)
        .order_by(User.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return {
        "users": [serialize_user(u) for u in users],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/me")
def my_profile(
    current_user: User = Depends(get_current_user)
):
    return {"user": serialize_user(current_user)}


@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target = db.get(User, user_id)

    if target is None:
        raise HTTPException(404, "User not found")

    allowed = (
        current_user.role == UserRole.ADMIN
        or current_user.id == target.id
        or (
            current_user.role == UserRole.STAFF
            and target.role == UserRole.STUDENT
        )
    )

    if not allowed:
        raise HTTPException(403, "Permission denied")

    return {"user": serialize_user(target)}


@router.patch("/{user_id}")
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin"))
):
    target = db.get(User, user_id)

    if target is None:
        raise HTTPException(404, "User not found")

    changes = data.model_dump(exclude_unset=True)

    if "name" in changes:
        if changes["name"] is None:
            raise HTTPException(422, "Name cannot be null")
        target.name = changes["name"].strip()

    if "email" in changes:
        if changes["email"] is None:
            raise HTTPException(422, "Email cannot be null")
        target.email = str(changes["email"]).lower()

    if "isActive" in changes:
        if changes["isActive"] is None:
            raise HTTPException(422, "isActive cannot be null")

        if target.id == admin.id and not changes["isActive"]:
            raise HTTPException(
                400, "Cannot deactivate yourself"
            )

        target.is_active = changes["isActive"]

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email already exists")

    db.refresh(target)

    return {
        "message": "User updated",
        "user": serialize_user(target)
    }


@router.delete("/{user_id}")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin"))
):
    if user_id == admin.id:
        raise HTTPException(
            400, "Cannot deactivate yourself"
        )

    target = db.get(User, user_id)

    if target is None:
        raise HTTPException(404, "User not found")

    target.is_active = False
    db.commit()

    return {"message": "User deactivated"}
