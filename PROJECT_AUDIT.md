# SkillHub audit

Baseline 44daff83 builds with Vite. ESLint reports 18 errors and five warnings. The backend dependency manifest omits Flask-Cors, which Flask imports at startup. Flask also restricts browser origins to local development even when FastAPI and invitation email use FRONTEND_URL.

React Router wraps the admin, staff and student layouts with protected routes. Auth, users and course mappings use context providers, and Redux stores courses. The frontend calls Flask for login and FastAPI for users, permissions, invitations, courses, modules, enrollment, quizzes and progress. PostgreSQL stores users and invitation token hashes, course ownership and instructor assignments, ordered modules with questions and options, student enrollments, attempts and completion records.

Admin pages cover user administration, invitations, mapping, courses and summary counts. Staff pages cover authoring, learners and mapping. Student pages cover assigned courses, module playback, quizzes and completion. Presence of a page or route alone does not verify a workflow.

Priorities are reproducible startup, cross-service authentication, isolated database tests for role workflows, then browser and production verification. Existing backend smoke scripts print results, including a sample password, and database smoke code executes on import. No versioned migration history or browser suite was present at baseline.

## Findings resolved

The browser workflow reproduced a staff authoring crash while the directory was loading and a session that survived logout. Staff permission grants were lost in the frontend user update, student profiles attempted a staff directory request, unfinished courses were counted as started, and course edits deleted and recreated module records. The student completion endpoint relied on a passing-score check in the browser. The changes connect the UI to server-enforced permissions, preserve module identities and verify a passing attempt before completion.

The isolated tests now verify registration, role-based login, course publication, admin assignment, quiz scoring, completion persistence, logout, expired sessions, invitation revocation and migration behavior. Production mail delivery requires verification with the intended provider.
