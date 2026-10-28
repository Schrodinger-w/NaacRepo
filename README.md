# NAAC Evidence Repository: CS314 prototype (Team T095)

Faculty upload NAAC accreditation evidence, department coordinators verify it, the IQAC lead
tracks institution-wide progress, and an admin manages users and audit logs.
Built from our SRS (Lab Assignments 1-4).

## Build progress

| Stage | What it adds | Status |
|---|---|---|
| 1 | Folder structure, dependencies, `.env`, MongoDB connection, `/api/health`, Vite proxy | Done |
| 2 | 8 data models, session sign-in/out, change password, role and department checks, CSRF protection, login rate limit, seed data, sign-in and profile pages | Done |
| 3 | App layout with role-based menu, upload with file checks, drafts, submit, review queue, PDF/image preview, approve/reject with feedback, locking | Done |
| 4 | Resubmission creates v1.1, v1.2 ... and keeps old files, version history timeline, old-version downloads for coordinator/IQAC, search with combinable filters and pagination | Done |
| 5 | IQAC dashboard with click-through, re-audit flag, admin user list + create user, audit log viewer with filters, read-only criteria page, demo checklist | Done |

**For the viva:** follow [docs/DEMO_CHECKLIST.md](docs/DEMO_CHECKLIST.md): setup, the 9-step scenario,
extra demonstrations, a manual test checklist and a map of where each feature lives in the code.

## Tech stack

| Part | Choice |
|---|---|
| Frontend | React 18, Vite 6, React Router 7, plain CSS with custom properties |
| Backend | Node.js 20+, Express 4 (ES modules) |
| Database | MongoDB Community Server 8.0 with Mongoose 8 |
| Login | `express-session` + `connect-mongo` (session cookie), `bcryptjs` for password hashes |
| Uploads | `multer` writing to `backend/storage/evidence/` |

React Router 7 is used instead of 6 because 6.x has an open-redirect security advisory with no fix
in the 6.x line. In the plain "declarative" mode we use, its API (`BrowserRouter`, `Routes`, `Route`,
`Link`) is the same as version 6. It needs Node.js 20 or newer.

## One-time setup (Windows, PowerShell)

1. Install Node.js 20 or newer from https://nodejs.org and check it with `node --version`.
2. Install MongoDB Community Server 8.0 as a Windows service, either with
   `winget install --id MongoDB.Server --exact --version 8.0.23 --source winget`
   or with the `.msi` from https://www.mongodb.com/try/download/community
   (choose "Complete" and keep "Install MongoD as a Service" ticked).
   Check it with `Get-Service MongoDB`: the status should be `Running`.
3. Install the backend packages and create its `.env` (in `backend`):
   ```powershell
   npm install
   Copy-Item .env.example .env
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Open `backend\.env` and replace the `SESSION_SECRET` value with the long string printed above.
4. Load the demo data (in `backend`): `npm run seed`
5. Install the frontend packages (in `frontend`): `npm install`

## Running the app

Use two PowerShell windows.

1. In `backend`: `npm run dev` (the API starts on http://127.0.0.1:5000 and restarts when you save a file)
2. In `frontend`: `npm run dev` (the UI starts on http://localhost:5173)
3. Open http://localhost:5173 in a browser and sign in with a demo account.

## Demo accounts

All four use the password `Demo@123`. The people are fictional, and `.test` email addresses
can never belong to anyone real.

| Role | Name | Email | Department |
|---|---|---|---|
| Faculty | Dr. Ananya Rao | ananya.rao@lnmiit.test | CSE |
| Department Coordinator | Dr. Vikram Mehta | vikram.mehta@lnmiit.test | CSE |
| IQAC Lead | Prof. Sunita Krishnan | sunita.krishnan@lnmiit.test | - |
| System Administrator | Rahul Verma | rahul.verma@lnmiit.test | - |

## Database scripts (run in `backend`)

| Command | What it does |
|---|---|
| `npm run seed` | Adds the demo data. Refuses to run if the database already has data, so it can never wipe work. |
| `npm run seed:reset` | **Deletes all data and all uploaded files**, signs everyone out, then adds the demo data again. |

## Folder structure

```
Prototype/
├─ backend/
│  ├─ .env                  your local settings (never share or commit)
│  ├─ .env.example          template for .env
│  ├─ storage/evidence/     uploaded files (created on first start, never served directly)
│  └─ src/
│     ├─ server.js          entry point: connect to MongoDB, then start listening
│     ├─ app.js             builds the Express app: middleware, routes, error handling
│     ├─ config/            env.js (settings), db.js (MongoDB), paths.js (folders), constants.js (roles, statuses...)
│     ├─ models/            the 8 Mongoose models, index.js (registers them all), fileSchema.js, plugins/appendOnly.js
│     ├─ middleware/        session, csrf, loginRateLimit, auth (requireAuth/Role/Department, allow),
│     │                     upload (multer + file checks), validate, errorHandler
│     ├─ controllers/       what each route does: auth, user, evidence, review, file, history, search,
│     │                     taxonomy, dashboard, audit
│     ├─ routes/            URL maps: health, auth, users, taxonomy, evidence, dashboard, audit
│     ├─ services/          evidenceRules (who may do what), evidencePresenter (what the API sends),
│     │                     fileStorage (files on disk), audit.service (audit-log entries)
│     ├─ utils/             HttpError, asyncHandler, password hashing, text (escapeRegex)
│     └─ seed/              seed.js and seedData.js (demo data)
└─ frontend/
   ├─ index.html
   ├─ vite.config.js        dev server + /api proxy to the backend
   └─ src/
      ├─ main.jsx           mounts the React app
      ├─ App.jsx            page map (routes)
      ├─ api/client.js      the only file that calls fetch(); adds the CSRF header
      ├─ auth/              AuthContext (who is signed in), RequireAuth, RequireRole (route guards)
      ├─ hooks/             useApiData (loading / error / data for a page)
      ├─ components/        StatusBadge, DataTable, FormField, Modal, Toast, EmptyState, ErrorState,
      │                     Spinner, PageHeader, Pagination, ProgressBar,
      │                     layout/ (AppShell, AppHeader, Sidebar, navigation)
      ├─ pages/             Login, Profile, MyEvidence, EvidenceForm (new/edit/resubmit), EvidenceDetail,
      │                     ReviewQueue, Search, Dashboard, Users, AuditLog, Criteria, NotFound
      ├─ utils/             labels.js, format.js, files.js (upload rules)
      └─ styles/global.css  design tokens and shared styles
docs/DEMO_CHECKLIST.md      demonstration script and manual test checklist
```

## Security measures

- Passwords are stored only as bcrypt hashes (cost 12); the hash is never sent to the browser.
- Sign-in uses a session cookie that JavaScript cannot read (HttpOnly, SameSite=Lax). Sessions live in
  MongoDB, get a new id at every sign-in, end after 30 minutes without activity (FR-007), and are
  destroyed on the server at sign-out (FR-003).
- CSRF protection with a hand-written double-submit cookie (`backend/src/middleware/csrf.js`).
- A wrong password and an unknown email get the same message and take the same time (FR-002).
  After 5 failed attempts for the same email from the same computer, sign-in is blocked for 15 minutes.
- Every protected route checks, in order: signed in, then role, then department.
- Input is validated with express-validator; the "simple" query parser stops `?x[$ne]=` tricks.
- The audit log, reviews and version history are append-only: the app can add to them but never change or delete them.
- Helmet security headers, CORS limited to the frontend, API reachable only from this computer.
- The browser gets short, generic error messages; full details appear only in the server terminal.

## Decisions where the SRS is unclear or contradicts itself

1. Allowed files: PDF, PNG, JPG/JPEG only, at most 10 MB, checked on the server by extension,
   MIME type and size (FR-009 to FR-011, BR-003, AC-02; SRS section 7's DOCX/XLSX is ignored).
2. Workflow: faculty upload, the department coordinator reviews (section 11, UC-011, acceptance criteria).
3. Four roles: `FACULTY`, `COORDINATOR`, `IQAC_LEAD`, `ADMIN`. There is no Viewer role.
4. Four stored statuses: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `NEEDS_REVISION`. "Updated" and
   "Re-Submitted" in the lifecycle diagram are transitions, not saved states.
5. Versions: v1.0 on first submit, then v1.1, v1.2 ... each time the file is replaced and
   resubmitted. Editing only metadata does not create a version.
6. Completion % (not defined in the SRS, labelled in the UI as a prototype metric):
   sub-metrics with at least one APPROVED evidence ÷ all sub-metrics of that criterion × 100.
7. Sub-metric codes are demo values (3-4 per criterion), not the official NAAC taxonomy.
8. Who sees which records: faculty and coordinators see only their own department; if they pick another
   department in a filter, the server uses their own instead and says so (UC-016). The IQAC lead and admin
   see all departments. Drafts are visible only to the person who created them (FR-018).
9. Files: anyone who can see a record can view its current file and its version history. Only the
   coordinator of that department and the IQAC lead can download older versions (FR-033, UC-015);
   everyone else gets "Access denied".
10. Re-audit flag (FR-029 and state diagram 30.1): APPROVED becomes NEEDS_REVISION and is unlocked; the
    IQAC lead must write a comment (BR-005). After the faculty member resubmits, it goes back to the coordinator.
11. Sign-in is by email only: FR-001 says "email or username", but our User model has no username.
12. Academic years offered: 2022-23 to 2026-27 (a demo list in `backend/src/config/constants.js`).
13. Password rules when changing a password: 8-64 characters, at least one letter and one number.
14. Search covers submitted evidence only. Drafts are private to their author (FR-018) and are listed
    under "My evidence". Search results come 10 per page, newest first.
15. Resubmitting a record with only corrected details (no new file) keeps its version number;
    the change is still recorded in the review trail and the audit log.
16. The dashboard is for the IQAC lead only (US-008 AC-01). Each criterion card links to the search page
    filtered by that criterion (AC-05).
17. New accounts get an initial password from the admin, who passes it on; users change it under My profile.

## Not built (agreed scope)

ZIP export of evidence, emails and password-reset links (the sign-in page says to contact the
administrator), admin password reset, role change or deactivation, editing criteria and sub-metrics
(seeded; the admin can view them), SSR/SSG, mobile app, AI features, NAAC portal integration,
automated test frameworks (see the manual checklist in docs/DEMO_CHECKLIST.md instead).
