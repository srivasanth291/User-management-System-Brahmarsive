
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.models.course import Course
from shared.models.user import User
from fastapi_app.dependencies import (
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


class CourseUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    description: str | None = None
    thumbnailUrl: str | None = None
    status: Literal["draft", "published", "archived"] | None = None


def course_to_dict(course: Course):
    return {
        "id": course.id,
        "title": course.title,
        "category": course.category,
        "description": course.description,
        "thumbnailUrl": course.thumbnail_url,
        "status": course.status,
        "createdBy": course.created_by
    }


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
    title = data.title.strip()
    category = data.category.strip()

    if not title or not category:
        raise HTTPException(422, "Title and category are required")

    course = Course(
        title=title,
        category=category,
        description=data.description,
        thumbnail_url=data.thumbnailUrl,
        status="draft",
        created_by=user.id
    )

    db.add(course)
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
        query = query.where(Course.status == "published")

    elif user.role.value == "staff":
        query = query.where(Course.created_by == user.id)

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

    if user.role.value == "student" and course.status != "published":
        raise HTTPException(404, "Course not found")

    if user.role.value == "staff" and course.created_by != user.id:
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

    changes = data.model_dump(exclude_unset=True)

    field_mapping = {
        "thumbnailUrl": "thumbnail_url"
    }

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

    db.delete(course)
    db.commit()

    return {
        "message": "Course deleted successfully"
    }
