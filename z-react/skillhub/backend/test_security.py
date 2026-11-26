from shared.security import hash_password, verify_password


def test_password_verification():
    hashed = hash_password("test password")
    assert verify_password("test password", hashed)
    assert not verify_password("incorrect", hashed)


def test_invalid_and_expired_sessions():
    import time
    import jwt
    from fastapi.testclient import TestClient
    from fastapi_app.main import app
    from flask_app.app import app as flask
    from shared.security import JWT_SECRET_KEY

    now = int(time.time())
    expired = jwt.encode({"sub": "1", "iat": now - 60, "exp": now - 1}, JWT_SECRET_KEY, algorithm="HS256")
    for token in ("invalid", expired):
        headers = {"Authorization": f"Bearer {token}"}
        assert TestClient(app).get("/api/auth/me", headers=headers).status_code == 401
        assert flask.test_client().get("/api/auth/me", headers=headers).status_code == 401
