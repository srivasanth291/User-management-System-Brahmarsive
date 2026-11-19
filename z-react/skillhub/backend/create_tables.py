
from shared.database import Base, engine

from shared.models.user import User
from shared.models.course import Course
from shared.models.learning import (
    Module,
    QuizQuestion,
    QuizOption
)
from shared.models.progress import (
    Enrollment,
    ModuleProgress,
    QuizAttempt
)
from shared.models.invitation import Invitation

print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")
