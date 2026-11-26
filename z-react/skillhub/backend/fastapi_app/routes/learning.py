
from fastapi import (
    APIRouter, Depends, HTTPException
)
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.models.course import Course
from shared.models.learning import (
    Module, QuizQuestion, QuizOption
)
from shared.models.user import User
from shared.models.progress import Enrollment
from fastapi_app.dependencies import (
    get_current_user, require_roles
)

router = APIRouter(
    prefix="/api",
    tags=["Learning Content"]
)


class OptionInput(BaseModel):
    text: str = Field(min_length=1)
    isCorrect: bool = False


class QuestionInput(BaseModel):
    question: str = Field(min_length=1)
    options: list[OptionInput] = Field(
        min_length=2,
        max_length=6
    )

    @model_validator(mode="after")
    def validate_answers(self):
        correct = sum(
            option.isCorrect for option in self.options
        )
        if correct != 1:
            raise ValueError(
                "Each question needs exactly one correct answer"
            )
        return self


class ModuleInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    videoTitle: str = ""
    videoUrl: str = ""
    explanation: str = ""
    questions: list[QuestionInput] = Field(
        default_factory=list,
        max_length=3
    )


def can_edit(course, user):
    if user.role.value == "admin":
        return True
    return (
        user.role.value == "staff"
        and course.created_by == user.id
    )


def get_course_or_404(db, course_id):
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(404, "Course not found")
    return course


def check_read(course, user, db):
    role = user.role.value

    if role == "admin":
        return

    if role == "staff":
        if (
            course.created_by == user.id
            or course.instructor_id == user.id
        ):
            return

        raise HTTPException(
            status_code=403,
            detail="You do not have access to this course"
        )

    if role == "student" and course.status == "published":
        enrolled = db.scalar(
            select(Enrollment.id).where(
                Enrollment.course_id == course.id,
                Enrollment.student_id == user.id
            )
        )

        if enrolled is not None:
            return

    raise HTTPException(
        status_code=403,
        detail="Permission denied"
    )

def save_questions(db, module_id, questions):
    for q_index, question in enumerate(
        questions, start=1
    ):
        item = QuizQuestion(
            module_id=module_id,
            question=question.question,
            position=q_index
        )
        db.add(item)
        db.flush()

        for o_index, option in enumerate(
            question.options, start=1
        ):
            db.add(
                QuizOption(
                    question_id=item.id,
                    text=option.text,
                    is_correct=option.isCorrect,
                    position=o_index
                )
            )


def module_to_dict(db, module, show_answers):
    questions = db.scalars(
        select(QuizQuestion)
        .where(QuizQuestion.module_id == module.id)
        .order_by(QuizQuestion.position)
    ).all()

    question_data = []

    for question in questions:
        options = db.scalars(
            select(QuizOption)
            .where(
                QuizOption.question_id == question.id
            )
            .order_by(QuizOption.position)
        ).all()

        question_data.append({
            "id": question.id,
            "question": question.question,
            "options": [
                {
                    **{
                        "id": option.id,
                        "text": option.text
                    },
                    **(
                        {"isCorrect": option.is_correct}
                        if show_answers else {}
                    )
                }
                for option in options
            ]
        })

    return {
        "id": module.id,
        "courseId": module.course_id,
        "title": module.title,
        "position": module.position,
        "videoTitle": module.video_title,
        "videoUrl": module.video_url,
        "explanation": module.explanation,
        "questions": question_data
    }


@router.post(
    "/courses/{course_id}/modules",
    status_code=201
)
def create_module(
    course_id: int,
    data: ModuleInput,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("admin", "staff")
    )
):
    course = get_course_or_404(db, course_id)

    if not can_edit(course, user):
        raise HTTPException(403, "Permission denied")

    existing = db.scalars(
        select(Module.position)
        .where(Module.course_id == course_id)
        .order_by(Module.position.desc())
        .limit(1)
    ).first()

    next_position = (existing or 0) + 1

    module = Module(
        course_id=course_id,
        title=data.title.strip(),
        position=next_position,
        video_title=data.videoTitle,
        video_url=data.videoUrl,
        explanation=data.explanation
    )

    db.add(module)
    db.flush()

    save_questions(
        db, module.id, data.questions
    )

    db.commit()
    db.refresh(module)

    return {
        "message": "Module created successfully",
        "module": module_to_dict(
            db, module, True
        )
    }


@router.get("/courses/{course_id}/modules")
def list_modules(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    course = get_course_or_404(db, course_id)
    check_read(course, user, db)

    modules = db.scalars(
        select(Module)
        .where(Module.course_id == course_id)
        .order_by(Module.position)
    ).all()

    show_answers = can_edit(course, user)

    return {
        "modules": [
            module_to_dict(
                db, module, show_answers
            )
            for module in modules
        ]
    }


@router.put("/modules/{module_id}")
def update_module(
    module_id: int,
    data: ModuleInput,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("admin", "staff")
    )
):
    module = db.get(Module, module_id)

    if module is None:
        raise HTTPException(404, "Module not found")

    course = get_course_or_404(
        db, module.course_id
    )

    if not can_edit(course, user):
        raise HTTPException(403, "Permission denied")

    module.title = data.title.strip()
    module.video_title = data.videoTitle
    module.video_url = data.videoUrl
    module.explanation = data.explanation

    questions = db.scalars(
        select(QuizQuestion).where(
            QuizQuestion.module_id == module_id
        )
    ).all()

    for question in questions:
        options = db.scalars(
            select(QuizOption).where(
                QuizOption.question_id == question.id
            )
        ).all()

        for option in options:
            db.delete(option)

        db.delete(question)

    db.flush()

    save_questions(
        db, module.id, data.questions
    )

    db.commit()

    return {
        "message": "Module updated successfully",
        "module": module_to_dict(
            db, module, True
        )
    }


@router.delete("/modules/{module_id}")
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("admin", "staff")
    )
):
    module = db.get(Module, module_id)

    if module is None:
        raise HTTPException(404, "Module not found")

    course = get_course_or_404(
        db, module.course_id
    )

    if not can_edit(course, user):
        raise HTTPException(403, "Permission denied")

    db.delete(module)
    db.commit()

    return {
        "message": "Module deleted successfully"
    }
