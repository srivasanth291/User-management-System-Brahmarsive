
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.models.user import User
from shared.models.course import Course
from shared.models.learning import (
    Module, QuizQuestion, QuizOption
)
from shared.models.progress import (
    Enrollment, ModuleProgress, QuizAttempt
)
from fastapi_app.dependencies import (
    get_current_user, require_roles
)

router = APIRouter(
    prefix="/api",
    tags=["Enrollment and Progress"]
)


class EnrollmentInput(BaseModel):
    studentId: int


class QuizSubmission(BaseModel):
    answers: dict[int, int] = Field(
        description="Question ID mapped to selected option ID"
    )


def get_course(db, course_id):
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(404, "Course not found")

    return course


def check_manager(course, user):
    if user.role.value == "admin":
        return

    if (
        user.role.value == "staff"
        and course.created_by == user.id
    ):
        return

    raise HTTPException(403, "Permission denied")


def require_enrollment(db, student_id, course_id):
    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.course_id == course_id
        )
    )

    if enrollment is None:
        raise HTTPException(
            403, "Student is not enrolled"
        )

    return enrollment


def get_student_module(db, module_id, user):
    module = db.get(Module, module_id)

    if module is None:
        raise HTTPException(404, "Module not found")

    course = get_course(db, module.course_id)

    if course.status != "published":
        raise HTTPException(
            403, "Course is not published"
        )

    require_enrollment(
        db, user.id, course.id
    )

    return module


@router.post(
    "/courses/{course_id}/enrollments",
    status_code=201
)
def enroll_student(
    course_id: int,
    data: EnrollmentInput,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("admin", "staff")
    )
):
    course = get_course(db, course_id)
    check_manager(course, user)

    student = db.get(User, data.studentId)

    if (
        student is None
        or not student.is_active
        or student.role.value != "student"
    ):
        raise HTTPException(
            422, "Valid active student required"
        )

    existing = db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == student.id,
            Enrollment.course_id == course_id
        )
    )

    if existing:
        return {
            "message": "Student already enrolled",
            "enrollmentId": existing.id
        }

    enrollment = Enrollment(
        student_id=student.id,
        course_id=course_id
    )

    db.add(enrollment)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "Enrollment already exists"
        )

    db.refresh(enrollment)

    return {
        "message": "Student enrolled successfully",
        "enrollmentId": enrollment.id
    }


@router.get("/courses/{course_id}/enrollments")
def list_enrollments(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("admin", "staff")
    )
):
    course = get_course(db, course_id)
    check_manager(course, user)

    rows = db.execute(
        select(Enrollment, User)
        .join(
            User,
            Enrollment.student_id == User.id
        )
        .where(Enrollment.course_id == course_id)
    ).all()

    return {
        "students": [
            {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "enrollmentId": enrollment.id
            }
            for enrollment, student in rows
        ]
    }


@router.delete(
    "/courses/{course_id}/enrollments/{student_id}"
)
def remove_enrollment(
    course_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("admin", "staff")
    )
):
    course = get_course(db, course_id)
    check_manager(course, user)

    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == student_id
        )
    )

    if enrollment is None:
        raise HTTPException(404, "Enrollment not found")

    db.delete(enrollment)
    db.commit()

    return {"message": "Enrollment removed"}


@router.get("/students/me/courses")
def my_courses(
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("student")
    )
):
    courses = db.scalars(
        select(Course)
        .join(
            Enrollment,
            Enrollment.course_id == Course.id
        )
        .where(
            Enrollment.student_id == user.id,
            Course.status == "published"
        )
        .order_by(Course.id.desc())
    ).all()

    return {
        "courses": [
            {
                "id": course.id,
                "title": course.title,
                "category": course.category,
                "description": course.description,
                "thumbnailUrl": course.thumbnail_url,
                "status": course.status
            }
            for course in courses
        ]
    }


@router.post("/modules/{module_id}/complete")
def complete_module(
    module_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("student")
    )
):
    get_student_module(db, module_id, user)

    progress = db.scalar(
        select(ModuleProgress).where(
            ModuleProgress.student_id == user.id,
            ModuleProgress.module_id == module_id
        )
    )

    if progress is None:
        progress = ModuleProgress(
            student_id=user.id,
            module_id=module_id,
            completed=True
        )
        db.add(progress)
    else:
        progress.completed = True

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "Concurrent progress update"
        )

    return {
        "message": "Module completed",
        "moduleId": module_id
    }


@router.post("/modules/{module_id}/quiz/submit")
def submit_quiz(
    module_id: int,
    data: QuizSubmission,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("student")
    )
):
    get_student_module(db, module_id, user)

    questions = db.scalars(
        select(QuizQuestion).where(
            QuizQuestion.module_id == module_id
        )
    ).all()

    if not questions:
        raise HTTPException(
            422, "This module has no quiz"
        )

    question_ids = {q.id for q in questions}

    if set(data.answers.keys()) != question_ids:
        raise HTTPException(
            422, "Answer every question exactly once"
        )

    correct_count = 0

    for question in questions:
        selected_id = data.answers[question.id]

        selected = db.scalar(
            select(QuizOption).where(
                QuizOption.id == selected_id,
                QuizOption.question_id == question.id
            )
        )

        if selected is None:
            raise HTTPException(
                422, "Invalid answer option"
            )

        if selected.is_correct:
            correct_count += 1

    score = round(
        correct_count / len(questions) * 100,
        2
    )

    attempt = QuizAttempt(
        student_id=user.id,
        module_id=module_id,
        score=score
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "message": "Quiz submitted",
        "attemptId": attempt.id,
        "correctAnswers": correct_count,
        "totalQuestions": len(questions),
        "score": score
    }


@router.get("/courses/{course_id}/progress")
def course_progress(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("student")
    )
):
    course = get_course(db, course_id)

    if course.status != "published":
        raise HTTPException(
            403, "Course is not published"
        )

    require_enrollment(db, user.id, course_id)

    modules = db.scalars(
        select(Module)
        .where(Module.course_id == course_id)
        .order_by(Module.position)
    ).all()

    completed_ids = set(
        db.scalars(
            select(ModuleProgress.module_id).where(
                ModuleProgress.student_id == user.id,
                ModuleProgress.completed.is_(True)
            )
        ).all()
    )

    completed = sum(
        module.id in completed_ids
        for module in modules
    )

    total = len(modules)

    percentage = (
        round(completed / total * 100, 2)
        if total else 0
    )

    return {
        "courseId": course_id,
        "totalModules": total,
        "completedModules": completed,
        "progressPercentage": percentage,
        "modules": [
            {
                "id": module.id,
                "title": module.title,
                "completed": module.id in completed_ids
            }
            for module in modules
        ]
    }
