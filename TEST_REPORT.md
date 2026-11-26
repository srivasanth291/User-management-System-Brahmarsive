# SkillHub verification

Tests ran on Linux with Python 3.12, Node 24, Chromium and an isolated PostgreSQL cluster created by pgserver. The test harness generates its own JWT signing key and database connection. Browser tests start Flask, FastAPI and Vite on loopback ports 15000, 18000 and 15173.

| Check | Result |
| --- | --- |
| Backend and browser suite | 9 pytest tests passed, including a Playwright workflow using all three roles |
| Frontend client errors | 1 Node test passed for validation, expired sessions and network failures |
| Frontend toolchain | ESLint, TypeScript and Vite production build passed |
| Database upgrade | Applied twice to an isolated baseline-shaped users table with an existing row |
| Dependency review | npm audit and pip-audit of backend runtime requirements reported zero known vulnerabilities |

The browser test signs in as an administrator and verifies the directory, publishes a staff-authored course with a video URL and three questions, assigns it through admin mapping, then submits the quiz as a student. It verifies 100% completion after reload and tests a protected URL after logout. API tests cover invitation acceptance and reuse, expiry, revocation, permissions, enrollment, quiz gating, atomic edit rollback and stable module IDs.

Invitation tests capture the generated registration link. A separate transport test checks message content, STARTTLS and authentication with a substituted SMTP client. External inbox delivery, external video playback and production deployment were outside this run. Pytest emitted two dependency warnings about the Linux runtime directory and Starlette's HTTP test client.

## Reproduce

From the frontend directory run `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` and `npm audit`. In the backend virtual environment run `python -m pip install -r requirements-test.txt`, then `python -m pytest -q`. Install Chromium or run `python -m playwright install chromium` first. pgserver needs a supported platform and writable temporary storage. For the Python advisory check, install pip-audit and run `pip-audit -r requirements.txt`.
