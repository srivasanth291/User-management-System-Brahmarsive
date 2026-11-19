
from sqlalchemy import (
    Integer, String, Text, Boolean,
    ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column

from shared.database import Base


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )

    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(200), nullable=False
    )

    position: Mapped[int] = mapped_column(
        Integer, nullable=False
    )

    video_title: Mapped[str] = mapped_column(
        String(200), default="", nullable=False
    )

    video_url: Mapped[str] = mapped_column(
        Text, default="", nullable=False
    )

    explanation: Mapped[str] = mapped_column(
        Text, default="", nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "course_id", "position",
            name="uq_module_position"
        ),
    )


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )

    module_id: Mapped[int] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    question: Mapped[str] = mapped_column(
        Text, nullable=False
    )

    position: Mapped[int] = mapped_column(
        Integer, nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "module_id", "position",
            name="uq_quiz_question_position"
        ),
    )


class QuizOption(Base):
    __tablename__ = "quiz_options"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey(
            "quiz_questions.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    text: Mapped[str] = mapped_column(
        Text, nullable=False
    )

    is_correct: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    position: Mapped[int] = mapped_column(
        Integer, nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "question_id", "position",
            name="uq_quiz_option_position"
        ),
    )
