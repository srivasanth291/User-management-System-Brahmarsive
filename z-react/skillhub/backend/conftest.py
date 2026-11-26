import os
import secrets
import tempfile
from pathlib import Path

import pgserver

# Configure the isolated cluster before application imports create the engine.
_test_directory = tempfile.TemporaryDirectory(prefix="skillhub-pytest-")
_server = pgserver.get_server(Path(_test_directory.name))
os.environ["DATABASE_URL"] = _server.get_uri().replace("postgresql:", "postgresql+psycopg:", 1)
os.environ["JWT_SECRET_KEY"] = secrets.token_hex(32)


def pytest_sessionstart(session):
    from fastapi_app.main import app
    from shared.database import Base, engine

    Base.metadata.create_all(engine)


def pytest_sessionfinish(session, exitstatus):
    from shared.database import engine

    engine.dispose()
    _server.cleanup()
    _test_directory.cleanup()
