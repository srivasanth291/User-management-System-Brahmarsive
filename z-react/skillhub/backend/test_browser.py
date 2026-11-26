import os
import signal
import shutil
import subprocess
import sys
import time
from contextlib import ExitStack
from pathlib import Path

import httpx
from playwright.sync_api import expect, sync_playwright

from shared.database import SessionLocal
from shared.models.user import User, UserRole
from shared.security import hash_password

ROOT = Path(__file__).resolve().parent


def test_role_dashboards_and_course_player():
    password = "browser test password"
    with SessionLocal.begin() as db:
        for role in UserRole:
            db.add(User(name=role.value.title(), email=f"web-{role.value}@example.org",
                        role=role, password_hash=hash_password(password),
                        permissions=["create_course", "manage_modules", "publish_course"] if role == UserRole.STAFF else []))

    frontend = "http://127.0.0.1:15173"
    flask = "http://127.0.0.1:15000"
    api = "http://127.0.0.1:18000"
    env = dict(os.environ, FRONTEND_URL=frontend, VITE_AUTH_API_URL=flask, VITE_API_URL=api)
    services = [
        ([sys.executable, "-m", "flask", "--app", "flask_app.app", "run", "--port", "15000"], ROOT, flask),
        ([sys.executable, "-m", "uvicorn", "fastapi_app.main:app", "--port", "18000"], ROOT, api),
        (["npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "15173", "--strictPort"], ROOT.parent, frontend),
    ]
    with ExitStack() as stack:
        for command, cwd, url in services:
            process = subprocess.Popen(command, cwd=cwd, env=env, start_new_session=True)
            stack.callback(os.killpg, process.pid, signal.SIGTERM)
            for _ in range(100):
                if process.poll() is not None:
                    raise RuntimeError(f"Startup failed for {url}")
                try:
                    if httpx.get(url).is_success:
                        break
                except httpx.ConnectError:
                    pass
                time.sleep(0.1)
            else:
                raise RuntimeError(f"Startup timed out for {url}")
        driver = stack.enter_context(sync_playwright())
        browser = driver.chromium.launch(executable_path=shutil.which("chromium"))
        stack.callback(browser.close)

        def login(role):
            page = browser.new_page()
            page.goto(frontend)
            page.get_by_label("Email").fill(f"web-{role}@example.org")
            page.get_by_label("Password").fill(password)
            page.get_by_role("button", name="Login").click()
            page.wait_for_url(f"**/{role}/dashboard")
            return page

        admin = login("admin")
        admin.goto(frontend + "/admin/users")
        expect(admin.get_by_text("web-student@example.org", exact=True)).to_be_visible()
        staff = login("staff")
        staff.goto(frontend + "/staff/courses/create")
        expect(staff.get_by_placeholder("Enter course title")).to_be_visible()
        staff.get_by_placeholder("Enter course title").fill("Browser lesson")
        staff.locator("select").select_option("Python")
        staff.get_by_placeholder("Enter course description").fill("Browser test")
        staff.get_by_role("button", name="Next: Module Builder").click()
        staff.get_by_placeholder("Example: Introduction to Python").fill("Introduction")
        staff.get_by_placeholder("Example: Python Basics").fill("Video")
        staff.get_by_placeholder("https://example.com/video").fill(frontend + "/video.mp4")
        staff.get_by_placeholder("Explain the module content").fill("A lesson")
        staff.get_by_role("button", name="Next: Quiz Builder").click()
        for i in range(3):
            staff.get_by_placeholder("Enter your question").nth(i).fill(f"Question {i}")
            for key in "ABC":
                staff.get_by_placeholder(f"Enter option {key}").nth(i).fill(f"Choice {key}")
            staff.locator('input[type=radio][value=A]').nth(i).check()
        staff.get_by_role("button", name="Save Module").click()
        staff.get_by_role("button", name="Publish Course").click()
        staff.wait_for_url("**/staff/courses")
        admin.goto(frontend + "/admin/course-mapping")
        admin.get_by_label("Select Student").select_option(label="Student (web-student@example.org)")
        admin.get_by_label("Select Course").select_option(label="Browser lesson")
        admin.get_by_role("button", name="Assign Course", exact=True).click()
        expect(admin.get_by_text("Course assigned successfully.")).to_be_visible()
        student = login("student")
        student.goto(frontend + "/student/courses")
        student.get_by_role("heading", name="Browser lesson").click()
        expect(student.get_by_label("A. Choice A", exact=True)).to_have_count(3)
        for answer in student.get_by_label("A. Choice A", exact=True).all():
            answer.check()
        student.get_by_role("button", name="Submit Quiz").click()
        expect(student.get_by_text("100% Complete", exact=True)).to_be_visible()
        student.reload()
        expect(student.get_by_text("100% Complete", exact=True)).to_be_visible()
        student.get_by_role("button", name="Logout").click()
        student.goto(frontend + "/admin/dashboard")
        expect(student.get_by_role("heading", name="SkillHub Login")).to_be_visible()
