
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.models.course import Course
from shared.models.learning import Module
from fastapi_app.routes.learning import ModuleInput, append_module, replace_module
from shared.models.user import User
from shared.models.progress import Enrollment
from fastapi_app.dependencies import (
    check_permission,
    get_current_user,
    require_roles
)


router = APIRouter(
    prefix="/api/courses",
    tags=["Courses"]
)


class CourseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    description: str = ""
    thumbnailUrl: str | None = None
    instructorId: int | None = None
    modules: list[ModuleInput] = Field(default_factory=list)
    status: Literal["draft", "published"] = "draft"


class ModuleEdit(ModuleInput):
    id: int | None = None


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    category: str | None = Field(default=None, max_length=100)
    description: str | None = None
    thumbnailUrl: str | None = None
    instructorId: int | None = None
    moduleEdits: list[ModuleEdit] = Field(default_factory=list)
    removedModuleIds: list[int] = Field(default_factory=list)
    status: Literal["draft", "published", "archived"] | None = None

def course_to_dict(course: Course):
    return {
        "id": course.id,
        "title": course.title,
        "category": course.category,
        "description": course.description,
        "thumbnailUrl": course.thumbnail_url,
        "status": course.status,
        "createdBy": course.created_by,
        "instructorId": course.instructor_id,
    }
def validate_instructor(db: Session, instructor_id: int | None):
    if instructor_id is None:
        return

    instructor = db.get(User, instructor_id)

    if (
        instructor is None
        or instructor.role.value != "staff"
        or not instructor.is_active
    ):
        raise HTTPException(
            status_code=422,
            detail="Please select a valid active staff instructor"
        )


def check_course_permission(course: Course, user: User):
    if user.role.value == "admin":
        return

    if (
        user.role.value == "staff"
        and course.created_by == user.id
    ):
        return

    raise HTTPException(
        status_code=403,
        detail="Permission denied"
    )


@router.post("", status_code=201)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin", "staff"))
):
    check_permission(user, "create_course")
    title = data.title.strip()
    category = data.category.strip()

    if not title or not category:
        raise HTTPException(422, "Title and category are required")
    validate_instructor(db, data.instructorId)
    if data.modules:
        check_permission(user, "manage_modules")
    if data.status == "published":
        check_permission(user, "publish_course")
    course = Course(
        title=title,
        category=category,
        description=data.description,
        thumbnail_url=data.thumbnailUrl,
        status=data.status,
        created_by=user.id,
        instructor_id=data.instructorId,
    )

    db.add(course)
    db.flush()
    for module in data.modules:
        append_module(db, course.id, module)
    db.commit()
    db.refresh(course)

    return {
        "message": "Course created successfully",
        "course": course_to_dict(course)
    }


@router.get("")
def get_courses(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = select(Course).order_by(Course.id.desc())

    if user.role.value == "student":
        query = query.join(Enrollment, Enrollment.course_id == Course.id).where(Course.status == "published", Enrollment.student_id == user.id)

    elif user.role.value == "staff":
        query = query.where(
            or_(
                Course.created_by == user.id,
                Course.instructor_id == user.id
            )
        )
       
    courses = db.scalars(query).all()

    return {
        "courses": [
            course_to_dict(course)
            for course in courses
        ]
    }


@router.get("/{course_id}")
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(404, "Course not found")

    if user.role.value == "student":
        enrolled = db.scalar(select(Enrollment.id).where(Enrollment.course_id == course.id, Enrollment.student_id == user.id))
        if course.status != "published" or enrolled is None:
            raise HTTPException(404, "Course not found")

    if user.role.value == "staff":
        if (
            course.created_by != user.id
            and course.instructor_id != user.id
        ):
            raise HTTPException(403, "Permission denied")
    return {"course": course_to_dict(course)}


@router.patch("/{course_id}")
def update_course(
    course_id: int,
    data: CourseUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin", "staff"))
):
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(404, "Course not found")

    check_course_permission(course, user)

    changes = data.model_dump(exclude_unset=True, exclude={"moduleEdits", "removedModuleIds"})
    if data.moduleEdits or data.removedModuleIds:
        check_permission(user, "manage_modules")
        ids = [edit.id for edit in data.moduleEdits if edit.id is not None] + data.removedModuleIds
        records = {m.id: m for m in db.scalars(select(Module).where(
            Module.course_id == course_id, Module.id.in_(ids)
        ).with_for_update())}
        if len(records) != len(ids):
            raise HTTPException(409, "Module list changed. Reload the course before saving")
        for edit in data.moduleEdits:
            if edit.id is None:
                append_module(db, course_id, edit)
            else:
                replace_module(db, records[edit.id], edit)
        for module_id in data.removedModuleIds:
            db.delete(records[module_id])

    if "status" in changes:
        check_permission(user, "publish_course")
    if changes.keys() - {"status"}:
        check_permission(user, "edit_course")

    field_mapping = {
    "thumbnailUrl": "thumbnail_url",
    "instructorId": "instructor_id",
    }
    if "instructorId" in changes:
        validate_instructor(db, changes["instructorId"])
    for field, value in changes.items():
        column = field_mapping.get(field, field)

        if field in ("title", "category"):
            if not isinstance(value, str) or not value.strip():
                raise HTTPException(
                    422,
                    f"{field} cannot be empty"
                )
            value = value.strip()

        if field in ("description", "status") and value is None:
            raise HTTPException(
                422,
                f"{field} cannot be null"
            )

        setattr(course, column, value)

    db.commit()
    db.refresh(course)

    return {
        "message": "Course updated successfully",
        "course": course_to_dict(course)
    }


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin", "staff"))
):
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(404, "Course not found")

    check_course_permission(course, user)

    check_permission(user, "publish_course")
    course.status = "draft"
    db.commit()
    db.refresh(course)

    return {
        "message": "Course moved to draft successfully"
    }
