from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient

from fastapi_app.main import app
from fastapi_app.routes import invitations
from flask_app.app import app as flask_app
from shared.database import SessionLocal
from shared.models.user import User, UserRole
from shared.security import hash_password


def test_invitation_through_completion(monkeypatch):
    api = TestClient(app)
    auth = flask_app.test_client()
    password = "example password"
    with SessionLocal.begin() as db:
        db.add(User(name="Administrator", role=UserRole.ADMIN,
                    email="admin@example.org", password_hash=hash_password(password)))

    def login(email):
        response = auth.post("/api/auth/login", json={"email": email, "password": password})
        assert response.status_code == 200
        return {"Authorization": "Bearer " + response.json["access_token"]}

    admin = login("admin@example.org")
    links = []
    monkeypatch.setattr(invitations, "send_invitation_email", lambda _, role, link: links.append(link))

    def register(role):
        email = role + "@example.org"
        assert api.post("/api/invitations/send", headers=admin, json={"email": email, "role": role}).status_code == 201
        token = parse_qs(urlparse(links.pop()).query)["token"][0]
        assert api.get("/api/invitations/verify", params={"token": token}).json()["valid"]
        data = {"name": role.title(), "password": password, "token": token}
        assert api.post("/api/invitations/register", json=data).status_code == 201
        assert api.post("/api/invitations/register", json=data).status_code == 400
        headers = login(email)
        return headers, api.get("/api/auth/me", headers=headers).json()["user"]["id"]

    staff, staff_id = register("staff")
    student, student_id = register("student")
    course = {"title": "Test course", "category": "Training"}
    assert api.post("/api/courses", headers=staff, json=course).status_code == 403
    permissions = ["create_course", "manage_modules", "publish_course"]
    assert api.put(f"/api/users/{staff_id}/permissions", headers=admin, json={"permissions": permissions}).status_code == 200
    course_id = api.post("/api/courses", headers=staff, json=course).json()["course"]["id"]
    path = f"/api/courses/{course_id}"
    question = {"question": "Choose A", "options": [{"text": "A", "isCorrect": True}, {"text": "B"}]}
    assert api.post(path + "/modules", headers=staff, json={"title": "Lesson", "questions": [question]}).status_code == 201
    assert api.patch(path, headers=staff, json={"status": "published"}).status_code == 200
    assert api.get(path, headers=student).status_code == 404
    assert api.post(path + "/enrollments", headers=admin, json={"studentId": student_id}).status_code == 201
    module = api.get(path + "/modules", headers=student).json()["modules"][0]
    module_path = f"/api/modules/{module['id']}"
    assert api.post(module_path + "/complete", headers=student).status_code == 409
    quiz = module["questions"][0]
    answers = {quiz["id"]: quiz["options"][0]["id"]}
    assert api.post(module_path + "/quiz/submit", headers=student, json={"answers": answers}).json()["score"] == 100
    assert api.post(module_path + "/complete", headers=student).status_code == 200
    assert api.get(path + "/progress", headers=student).json()["progressPercentage"] == 100


def test_invitation_expiry_and_revocation():
    from datetime import datetime, timedelta, timezone
    from shared.models.invitation import Invitation
    from shared.security import create_access_token
    from sqlalchemy import select

    api = TestClient(app)
    with SessionLocal.begin() as db:
        admin = User(name="Invite Admin", role=UserRole.ADMIN, email="invite-admin@example.org",
                     password_hash=hash_password("test password"))
        db.add(admin)
        db.flush()
        headers = {"Authorization": "Bearer " + create_access_token(admin.id)}
        now = datetime.now(timezone.utc)
        for token, expiry in [("expired-invitation-for-test", now - timedelta(seconds=1)),
                              ("pending-invitation-for-test", now + timedelta(hours=1))]:
            db.add(Invitation(email="invite@example.org", role="student", invited_by=admin.id,
                              token_hash=invitations.hash_token(token), expires_at=expiry))
        db.flush()
        invite_id = db.scalar(select(Invitation.id).where(Invitation.token_hash == invitations.hash_token(token)))
    assert api.get("/api/invitations/verify", params={"token": "expired-invitation-for-test"}).json()["detail"] == "Invitation expired"
    assert api.post(f"/api/invitations/{invite_id}/revoke", headers=headers).is_success
    assert api.get("/api/invitations/verify", params={"token": token}).json()["detail"] == "Invitation revoked"


def test_course_edit_preserves_identity_and_rolls_back_on_validation_error():
    from shared.security import create_access_token
    api = TestClient(app)
    with SessionLocal.begin() as db:
        actor = User(name="Editor", email="editor@example.org", password_hash=hash_password("test password"), role=UserRole.ADMIN)
        db.add(actor)
        db.flush()
        headers = {"Authorization": "Bearer " + create_access_token(actor.id)}
    course = api.post("/api/courses", headers=headers, json={"title": "First title", "category": "QA", "modules": [{"title": "First lesson"}]}).json()["course"]
    path = f"/api/courses/{course['id']}"
    module_id = api.get(path + "/modules", headers=headers).json()["modules"][0]["id"]
    changes = {"title": " ", "moduleEdits": [{"id": module_id, "title": "Updated lesson"}]}
    assert api.patch(path, headers=headers, json=changes).status_code == 422
    assert api.get(path + "/modules", headers=headers).json()["modules"][0]["title"] == "First lesson"
    changes["title"] = "Updated title"
    assert api.patch(path, headers=headers, json=changes).status_code == 200
    edited = api.get(path + "/modules", headers=headers).json()["modules"][0]
    assert (edited["id"], edited["title"]) == (module_id, "Updated lesson")
