from datetime import datetime
from sqlalchemy import (
    Integer, String, DateTime, ForeignKey, func
)
from sqlalchemy.orm import Mapped, mapped_column
from shared.database import Base

class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )

    email: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )

    role: Mapped[str] = mapped_column(
        String(20), nullable=False
    )

    token_hash: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False
    )

    invited_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
