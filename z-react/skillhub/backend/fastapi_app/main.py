
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import os

from shared.models.user import User

from fastapi_app.dependencies import (
    get_current_user,
    require_roles
)

from fastapi_app.routes.courses import (
    router as courses_router
)

from fastapi_app.routes.learning import (
    router as learning_router
)

from fastapi_app.routes.progress import (
    router as progress_router
)

from fastapi_app.routes.users import (
    router as users_router
)

from fastapi_app.routes.invitations import (
    router as invitations_router
)


app = FastAPI(title="SkillHub FastAPI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set([os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/"), "http://127.0.0.1:5173"])),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(courses_router)
app.include_router(learning_router)
app.include_router(progress_router)
app.include_router(users_router)
app.include_router(invitations_router)


@app.get("/")
def home():
    return {
        "message": "SkillHub FastAPI Backend Running"
    }


@app.get("/api/auth/me")
def fastapi_current_user(
    user: User = Depends(get_current_user)
):
    return {
        "message": "FastAPI authentication successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value
        }
    }


@app.post("/api/courses/test-create")
def test_create_course(
    user: User = Depends(
        require_roles("admin", "staff")
    )
):
    return {
        "message": "Course creation permitted",
        "created_by": user.name,
        "role": user.role.value
    }
