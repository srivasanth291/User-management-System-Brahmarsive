
import hashlib
import os
import secrets
import smtplib

from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.models.user import User, UserRole
from shared.models.invitation import Invitation
from shared.security import hash_password
from shared.email_service import send_invitation_email
from fastapi_app.dependencies import check_permission, require_roles


router = APIRouter(
    prefix="/api/invitations",
    tags=["Invitations"]
)


class InviteInput(BaseModel):
    email: EmailStr
    role: UserRole


class RegistrationInput(BaseModel):
    token: str = Field(min_length=20)
    name: str = Field(min_length=2, max_length=150)
    password: str = Field(min_length=8, max_length=128)


def hash_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def get_valid_invitation(
    db: Session,
    token: str,
    lock: bool = False
):
    query = select(Invitation).where(
        Invitation.token_hash == hash_token(token)
    )

    if lock:
        query = query.with_for_update()

    invitation = db.scalar(query)
    now = datetime.now(timezone.utc)

    if invitation is None:
        raise HTTPException(400, "Invalid invitation")

    if invitation.used_at is not None:
        raise HTTPException(400, "Invitation already used")

    if invitation.revoked_at is not None:
        raise HTTPException(400, "Invitation revoked")

    if invitation.expires_at <= now:
        raise HTTPException(400, "Invitation expired")

    return invitation


@router.post("/send", status_code=201)
def invite_user(
    data: InviteInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "staff")
    )
):
    if (
        current_user.role == UserRole.STAFF
        and data.role != UserRole.STUDENT
    ):
        raise HTTPException(
            403, "Staff can invite students only"
        )

    check_permission(current_user, "add_student")
    email = str(data.email).strip().lower()

    existing = db.scalar(
        select(User).where(User.email == email)
    )

    if existing:
        raise HTTPException(
            409, "Email already registered"
        )

    # Revoke older pending invitations for this email.
    pending = db.scalars(
        select(Invitation)
        .where(
            Invitation.email == email,
            Invitation.used_at.is_(None),
            Invitation.revoked_at.is_(None)
        )
        .with_for_update()
    ).all()

    now = datetime.now(timezone.utc)

    for old_invite in pending:
        old_invite.revoked_at = now

    token = secrets.token_urlsafe(32)

    invitation = Invitation(
        email=email,
        role=data.role.value,
        token_hash=hash_token(token),
        invited_by=current_user.id,
        expires_at=now + timedelta(hours=24)
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    frontend_url = os.environ.get(
        "FRONTEND_URL",
        "http://localhost:5173"
    ).rstrip("/")

    registration_link = (
        f"{frontend_url}/register"
        f"?token={quote(token)}"
    )

    try:
        send_invitation_email(
            email,
            data.role.value,
            registration_link
        )
    except (OSError, smtplib.SMTPException):
        raise HTTPException(
            502,
            "Invitation saved, but email delivery failed. "
            "Check SMTP settings and send again."
        )

    return {
        "message": "Invitation sent successfully",
        "invitationId": invitation.id,
        "email": email,
        "role": data.role.value
    }


@router.get("/verify")
def verify_invitation(
    token: str,
    db: Session = Depends(get_db)
):
    invitation = get_valid_invitation(db, token)

    return {
        "valid": True,
        "email": invitation.email,
        "role": invitation.role,
        "expiresAt": invitation.expires_at
    }


@router.post("/register", status_code=201)
def register_invited_user(
    data: RegistrationInput,
    db: Session = Depends(get_db)
):
    invitation = get_valid_invitation(
        db, data.token, lock=True
    )

    existing = db.scalar(
        select(User).where(
            User.email == invitation.email
        )
    )

    if existing:
        raise HTTPException(
            409, "Account already registered"
        )

    user = User(
        name=data.name.strip(),
        email=invitation.email,
        password_hash=hash_password(data.password),
        role=UserRole(invitation.role),
        is_active=True
    )

    db.add(user)
    invitation.used_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "Registration conflict"
        )

    db.refresh(user)

    return {
        "message": "Registration successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value
        }
    }


@router.get("")
def list_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "staff")
    )
):
    query = select(Invitation).order_by(
        Invitation.id.desc()
    )

    if current_user.role == UserRole.STAFF:
        query = query.where(
            Invitation.invited_by == current_user.id
        )

    invitations = db.scalars(query).all()
    now = datetime.now(timezone.utc)

    return {
        "invitations": [
            {
                "id": invite.id,
                "email": invite.email,
                "role": invite.role,
                "status": (
                    "accepted" if invite.used_at
                    else "revoked" if invite.revoked_at
                    else "expired"
                    if invite.expires_at <= now
                    else "pending"
                ),
                "invitedBy": invite.invited_by,
                "createdAt": invite.created_at
            }
            for invite in invitations
        ]
    }


@router.post("/{invitation_id}/revoke")
def revoke_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "staff")
    )
):
    invitation = db.get(Invitation, invitation_id)

    if invitation is None:
        raise HTTPException(404, "Invitation not found")

    if (
        current_user.role == UserRole.STAFF
        and invitation.invited_by != current_user.id
    ):
        raise HTTPException(403, "Permission denied")

    if invitation.used_at:
        raise HTTPException(
            409, "Accepted invitation cannot be revoked"
        )

    invitation.revoked_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Invitation revoked"}
