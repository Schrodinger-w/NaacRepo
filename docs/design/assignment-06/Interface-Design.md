# Interface Design

**The LNM Institute of Information Technology, Jaipur**
Software Development Laboratory — Course Code: CS314
Lab Assignment 7, Task 3 — Interface Design
Project: NAAC Evidence Repository · Team T095

---

## 1. Scope and purpose

This document specifies the two kinds of interface the system needs:

- **Part A — User Interface Design**: the screens through which people use the system, the
  fields, buttons and messages on each one, how a user moves between them, and what the system
  says when something goes wrong.
- **Part B — Software Interface Design**: the interfaces through which the system's own
  components talk to each other, the operations each one exposes, and the inputs, outputs and
  error responses of each operation.

It covers the three detailed use cases carried through Assignments 2 to 5:

| Use case | Title | Primary actor |
|---|---|---|
| UC-004 | Upload Evidence | Faculty Member |
| UC-011 | Review Submitted Evidence (Approve / Reject) | Department Coordinator |
| UC-016 | Search and Filter Evidence | Any Authenticated User |

Screens that these three use cases depend on but that belong to other use cases — Sign In
(UC-001) and the evidence detail screen — are specified here as well, because the three cannot
be described without them.

### Related documents

| Document | Relationship |
|---|---|
| SRS (Assignments 1–2) | Source of every FR, BR, NFR and AC referenced below |
| Detailed use cases (Assignment 2, §19) | Main and alternative flows the screens implement |
| Activity and state diagrams (Assignment 5) | The transitions the screens trigger |
| Component diagram (Assignment 5, §31) | The components whose interfaces Part B specifies |
| `Data-Class-Design.md` | The classes the API payloads are built from |
| `Architectural-Design.md` | The layers the interfaces in Part B sit between |
| `Component-Level-Design.md` | The internal logic behind the operations listed here |

### A note on method

The prototype in `backend/` and `frontend/` implements all three use cases, so the interfaces
below are specified against working screens and working routes rather than being invented on
paper. Every message quoted in this document is the exact string the system produces. Where the
design deliberately departs from a literal reading of the SRS, the reason is given in §6.

---

## 2. Part A — User Interface Design

### 2.1 Design principles

These rules hold on every screen, so the per-screen sections below do not repeat them.

| Principle | How it is applied | Source |
|---|---|---|
| Role-appropriate navigation | The sidebar lists only the pages the signed-in role may use | FR-008 |
| Status is never colour alone | Every status badge carries a text label beside its colour | FR-030, NFR-009 |
| Four screen states | Every screen that loads data defines a loading, error, empty and success state | NFR-009 |
| Errors beside the field | A field-level message appears under the field it concerns, with a summary at the top of the form | NFR-009 |
| Plain language | No status codes or technical terms in user-facing text | NFR-009 |
| Labelled controls | Every input has a `<label for>`; hints and errors are linked by `aria-describedby` | NFR-017 |
| No animation | Loading indicators and state changes are static | Team decision |
| Confirmation before irreversible actions | Submit, delete, approve, reject and flag each open a confirmation dialog | NFR-010 |

### 2.2 Screen inventory

| # | Screen | Use case | Roles | Wireframe |
|---|---|---|---|---|
| S-01 | Sign In | UC-001 (precondition for all three) | Everyone | [UI-WF-01](diagrams/interfaces/UI-Wireframe-01-Sign-In.png) |
| S-02 | Application shell and navigation | All | All signed-in | [UI-WF-02](diagrams/interfaces/UI-Wireframe-02-App-Shell-Navigation.png) |
| S-03 | My Evidence | UC-004 entry, UC-009 | Faculty | [UI-WF-03](diagrams/interfaces/UI-Wireframe-03-My-Evidence.png) |
| S-04 | Upload Evidence form | UC-004, UC-005, UC-006, UC-012 | Faculty | [UI-WF-04](diagrams/interfaces/UI-Wireframe-04-Upload-Evidence.png) |
| S-05 | Upload form — validation and error states | UC-004 alternative flows | Faculty | [UI-WF-05](diagrams/interfaces/UI-Wireframe-05-Upload-Validation-Errors.png) |
| S-06 | Evidence Detail | UC-004 post-condition, UC-014, UC-016 step 7 | All permitted | [UI-WF-06](diagrams/interfaces/UI-Wireframe-06-Evidence-Detail-Draft.png) |
| S-07 | Review Queue | UC-010, UC-011 steps 1–2 | Coordinator | [UI-WF-07](diagrams/interfaces/UI-Wireframe-07-Review-Queue.png) |
| S-08 | Review Evidence | UC-011 steps 3–6 | Coordinator | [UI-WF-08](diagrams/interfaces/UI-Wireframe-08-Review-Evidence.png) |
| S-09 | Reject dialog | UC-011 alternative flow | Coordinator | [UI-WF-09](diagrams/interfaces/UI-Wireframe-09-Reject-Dialog.png) |
| S-10 | Approve dialog | UC-011 main flow | Coordinator | [UI-WF-10](diagrams/interfaces/UI-Wireframe-10-Approve-Dialog.png) |
| S-11 | Search and Filter Evidence | UC-016 | All signed-in | [UI-WF-11](diagrams/interfaces/UI-Wireframe-11-Search-Results.png) |
| S-12 | Search — exceptional flows | UC-016 alternative flows | All signed-in | [UI-WF-12](diagrams/interfaces/UI-Wireframe-12-Search-Exceptions.png) |

Screens outside the three use cases (IQAC dashboard, admin users, audit log, profile) exist in
the prototype but are not specified here, because Task 3 limits the scope to the three selected
use cases.

### 2.3 Navigation between screens

The complete screen flow is drawn in
[Screen-Flow-Map.png](diagrams/interfaces/Screen-Flow-Map.png).

Every flow starts at **Sign In**. Because the landing page depends on the role (FR-008), the
three use cases begin on different screens:

| Role | Landing screen |
|---|---|
| Faculty | My Evidence (S-03) |
| Department Coordinator | Review Queue (S-07) |
| IQAC Lead | Dashboard |
| System Administrator | Users |

The three use cases chain into one another, which is what makes the workflow continuous:

- **UC-004 ends** with a record in *Pending Review* that appears in the coordinator's queue.
  That is exactly **UC-011's precondition**.
- **UC-011 ends** either with *Approved* (locked, BR-004) or with *Needs Revision* plus
  feedback. *Needs Revision* leads to UC-012, whose resubmission re-enters UC-011 at the queue.
- **UC-016** is reachable from every role's sidebar and ends at the same Evidence Detail screen
  (S-06) the other two use cases use.

Session expiry (FR-007) can interrupt any screen and returns the user to Sign In. This single
transition applies everywhere and is omitted from the map to keep it readable.

### 2.4 UC-004 — Upload Evidence

**Screens:** S-03 → S-04 → (S-05 on failure) → S-06

#### Input fields (S-04)

| Field | Control | Required for draft | Required to submit | Rules | Source |
|---|---|---|---|---|---|
| Title | Text | Yes | Yes | 1–200 characters | FR-012, AC-04 |
| Description | Textarea | No | No | Up to 2000 characters | FR-013 |
| NAAC criterion | Select | No | Yes | One of the 7 criteria | FR-014, AC-05 |
| Sub-metric | Select | No | Yes | Must belong to the chosen criterion | FR-015, AC-06 |
| Academic year | Select | No | Yes | One of the configured years | FR-016, AC-07 |
| Department | Read-only text | — | — | Taken from the account, not editable | FR-017, AC-08 |
| Evidence file | File picker | No | Yes | PDF/PNG/JPG, at most 10 MB | FR-009–011, AC-02/03 |

The **sub-metric** select is disabled until a criterion is chosen, and then offers only that
criterion's sub-metrics. Changing the criterion clears a sub-metric that no longer belongs to
it. This makes the AC-06 pairing hard to get wrong in the interface, and the server enforces it
again regardless.

The **department** is displayed for confirmation but cannot be edited. It is attached on the
server from the signed-in account, so a department supplied in a request is ignored (AC-08).

#### Buttons and outputs

| Control | Effect | Output |
|---|---|---|
| Submit for review | Validates every mandatory field, sets status to *Pending Review*, records v1.0 | Toast "Evidence submitted for review."; navigates to S-06 |
| Save as draft | Saves with only a title required; stays private to the author | Toast "Draft saved."; navigates to S-06 |
| Cancel | Abandons the form | Returns to S-03 or S-06 |

Pressing **Enter** inside the form saves a draft; it never submits. This is deliberate, so a
stray keystroke cannot send incomplete evidence to the coordinator.

#### Validation and error messages (S-05)

| Scenario | Message | Where | Source |
|---|---|---|---|
| Title empty | "Enter a title." | Under Title | AC-04 |
| Criterion not chosen | "Choose a NAAC criterion." | Under Criterion | AC-05 |
| Sub-metric not chosen | "Choose a sub-metric." | Under Sub-metric | AC-06 |
| Academic year not chosen | "Choose an academic year." | Under Academic year | AC-07 |
| File missing on submit | "Attach the evidence file (PDF, PNG or JPG)." | Under Evidence file | FR-009 |
| Unsupported file type | "Only PDF, PNG or JPG files are allowed." | Under Evidence file | AC-02 |
| File over 10 MB | "The file is larger than 10 MB." | Under Evidence file | AC-03 |
| File contents do not match its extension | "This file is not a genuine PDF, PNG or JPG. Please check the file and try again." | Under Evidence file | FR-010 |
| Sub-metric does not match criterion | "This sub-metric does not belong to the chosen criterion." | Under Sub-metric | AC-06 |
| Any mandatory field missing | "Complete the highlighted fields before submitting." | Banner at top of form | UC-004 alt. flow |
| Title too long | "Keep the title under 200 characters." | Under Title | — |
| Server unreachable | "Cannot reach the server. Check that the app is still running." | Banner | NFR-009 |

Every missing field is reported at once rather than one at a time, so the user does not have to
submit repeatedly to discover each problem.

File type and size are checked as soon as a file is chosen, which gives immediate feedback. The
server repeats both checks and additionally reads the file's first bytes, which the browser
cannot do — this is what catches a `.docx` renamed to `.pdf`.

#### Post-condition (S-06)

The evidence detail screen shows the status badge *Pending Review*, version **v1.0**, the full
metadata, an in-page file preview, and an explanation that the record cannot be edited while it
is being reviewed. This satisfies AC-09 (status becomes Pending Review) and AC-10 (the user
receives a confirmation).

### 2.5 UC-011 — Review Submitted Evidence

**Screens:** S-07 → S-08 → S-09 or S-10 → S-08 (updated)

#### Review queue (S-07)

| Element | Content | Source |
|---|---|---|
| Totals | Three tiles: Pending review, Approved, Needs revision, for this department | SRS §11.2 |
| Table columns | Title, Submitted by, Criterion, Sub-metric, Year, Version, Waiting since, Review button | FR-023 |
| Order | Oldest first, so the longest-waiting submission is handled first | FR-023 |
| Scope | This coordinator's own department only | FR-023, NFR-006 |
| Refresh | Manual button | See §6, decision 4 |
| Empty state | "Nothing is waiting for review." | NFR-009 |

#### Review screen (S-08)

The uploaded file and its metadata are shown side by side, so the decision is made with both in
view (FR-024, AC-02). PDFs render in the browser's own viewer; images render inline. Below the
preview the screen states: *"If the preview does not appear, download the file to inspect it."*
This is the UC-011 alternative flow for a preview that fails to load.

A third alternative flow — the coordinator needs more information before deciding — requires no
control: leaving the screen leaves the record *Pending Review* until it is revisited.

#### Decision dialogs (S-09, S-10)

| | Reject (S-09) | Approve (S-10) |
|---|---|---|
| Title | "Reject and send back for revision?" | "Approve this evidence?" |
| Comment field | **Required** | Optional |
| Field label | "Feedback for the faculty member" | "Comment for the faculty member (optional)" |
| Confirm button | "Reject with feedback" | "Approve and lock" |
| Blocked when empty | Yes — "Enter feedback explaining what needs to change." | No |
| Resulting status | Needs Revision | Approved, locked |
| Confirmation | "Evidence sent back to the faculty member for revision." | "Evidence approved and locked." |

Mandatory rejection feedback (FR-027, BR-005, AC-04) is enforced twice: the dialog refuses to
send an empty comment, and the server rejects one with HTTP 400. The dialog stays open, the
textarea is marked invalid, and the record's status does not change.

Approving sets *Approved* and locks the record, after which the faculty member's edit and
delete controls disappear entirely (FR-025, BR-004, AC-03). The new status appears on both the
faculty member's and the coordinator's screens immediately (AC-07), and the record leaves the
queue.

The feedback is shown to the faculty member in two places — at the top of My Evidence under
"Needs your attention", and on the evidence detail screen (AC-06).

#### Error messages

| Scenario | Message | HTTP |
|---|---|---|
| Rejection without feedback | "Enter feedback explaining what needs to change." | 400 |
| Record is no longer pending | "This record is not waiting for review. It is \"Approved\"." | 409 |
| Reviewer is not this department's coordinator | "Only a coordinator of this record's department can review it." | 403 |
| Two coordinators decide at the same moment | "This record was changed by someone else at the same time. Reload the page and try again." | 409 |

### 2.6 UC-016 — Search and Filter Evidence

**Screens:** S-11, with exceptional states on S-12, leading to S-06

#### Filters

| Filter | Control | Behaviour | Source |
|---|---|---|---|
| Search words | Text | Matches title **and** description, case-insensitive | FR-034 |
| Criterion | Select | One of the 7 | FR-035 |
| Academic year | Checkboxes | **Several at once** | FR-036 |
| Department | Select | Limited by role, see below | FR-037 |
| Status | Select | Pending review, Approved, Needs revision | FR-038 |

All filters combine (FR-039). They are held in the page address rather than in memory, so a
search can be bookmarked and shared, and the IQAC dashboard can link straight to a filtered
list.

#### Results

Ten rows per page, newest first, with Previous / Next controls and a "Page *n* of *m*"
indicator. The number of matches is announced above the table. Selecting a row opens S-06 with
the full metadata, status and version history (UC-016 steps 7–8).

Drafts never appear in results, whoever searches, because a draft is private to its author
(FR-018).

#### Exceptional flows (S-12)

| Flow | Behaviour | Source |
|---|---|---|
| No records match | A "No results found" panel replaces the table, with "Try fewer filters or different search words." The filters stay on screen so they can be relaxed. | UC-016 alt. flow 1 |
| Department outside the user's scope | The user is **not** shown an error and is **not** given the data. Their own department is used instead and the screen says: "You can only search evidence from your own department (CSE), so your department was used instead of the one you chose." | UC-016 alt. flow 2, FR-037 |
| Large result set | Paginated | UC-016 alt. flow 3 |

The second flow deserves a note. The SRS says the system "restricts results to their own
department". Substituting the scope on the server, rather than hiding the control, means a
hand-written request cannot reach another department's records either (NFR-006). The notice is
shown so the results are not silently different from what was asked for.

Downloading a file and viewing a record are both written to the audit log (UC-016 step 10).

### 2.7 Consolidated message catalogue

Messages shared across all three use cases.

| Situation | Message | Type |
|---|---|---|
| Wrong password, or an email with no account | "Invalid email or password." | Error |
| Too many failed sign-ins | "Too many failed sign-in attempts. Try again in 15 minute(s)." | Error |
| Session expired | "You were signed out after a period of inactivity. Please sign in again." | Information |
| Not signed in | "Please sign in to continue." | Error |
| Role not permitted | "You do not have permission to do this." | Error |
| Record belongs to another department | "This record belongs to another department." | Error |
| Draft belongs to another user | "This draft is private to the faculty member who created it." | Error |
| Record not found | "The requested record was not found." | Error |
| Approved record edit attempted | "This evidence is approved and locked, so it can no longer be changed." | Error |
| CSRF check failed | "Security check failed. Refresh the page and try again." | Error |
| Unexpected server fault | "Something went wrong on the server. Please try again." | Error |

The last entry is deliberately vague: internal details are written to the server log only, never
sent to the browser (NFR-004).

---

## 3. Part B — Software Interface Design

### 3.1 Components and the interfaces between them

The analysis components from the Assignment 5 component diagram map onto the implemented
modules as follows. Where a name changed, the reason is given.

| Assignment 5 component | Implemented as | Note |
|---|---|---|
| LoginUI, EvidenceUploadUI, ReviewDashboardUI, SearchFilterUI | `frontend/src/pages/*` | Unchanged in role |
| — | `frontend/src/api/client.js` | Added: one gateway for all browser-to-server calls |
| AuthService | `controllers/auth.controller.js`, `middleware/auth.js`, `middleware/session.js` | Split into request handling and access control |
| EvidenceManager | `controllers/evidence.controller.js` | Unchanged in role |
| ReviewWorkflowManager | `controllers/review.controller.js` | Unchanged in role |
| SearchFilterEngine | `controllers/search.controller.js` | Unchanged in role |
| VersionManager | `controllers/history.controller.js`, `models/EvidenceVersion.js` | Unchanged in role |
| FileHandler | `middleware/upload.js` | Validation of incoming files |
| MetadataHandleManager | `services/evidencePresenter.js` | Shapes what the API returns |
| — | `services/evidenceRules.js` | **Added**: the workflow rules, extracted so the UI and the server cannot disagree |
| AuditLogger | `services/audit.service.js`, `models/AuditLog.js` | Unchanged in role |
| FileStorageManager | `services/fileStorage.js` | Unchanged in role |
| DatabaseRepository | Mongoose models in `models/` | Mongoose provides the repository layer |
| NotificationService, SMTP Mail Server | **Removed** | Email is out of scope; the faculty member is notified in-app instead |

`evidenceRules.js` is the one significant addition. Extracting the workflow rules into pure
functions lets the same rules decide two different things: whether the server allows an action,
and which buttons the screen is allowed to show. This is why the interface can never offer an
action the server would refuse.

### 3.2 Interface catalogue

Eight interfaces carry all communication between components.

#### I-01 `IApiGateway` — Web client → Application server

The only path from the browser to the server. HTTP over the Vite dev-server proxy, so every
request is same-origin.

| Property | Value |
|---|---|
| Provided by | Express application (`app.js`) |
| Required by | Every page component |
| Protocol | HTTP/1.1, JSON request and response bodies; `multipart/form-data` for uploads |
| Authentication | `naac_sid` session cookie, HttpOnly, SameSite=Lax |
| Integrity | `X-CSRF-Token` header must equal the `naac_csrf` cookie on POST/PATCH/DELETE |
| Error format | `{ "message": string, "errors"?: [{ "field": string, "message": string }] }` |

The complete operation list is §3.3.

#### I-02 `IAuthService` — Authentication and session

| Operation | Input | Output | Errors |
|---|---|---|---|
| `getCurrentUser(session)` | Session cookie | `{ user }` or `{ user: null }` | — |
| `login(email, password)` | Credentials | `{ user }`, new session id, new CSRF token | 400 malformed, 401 invalid, 429 rate-limited |
| `logout(session)` | Session cookie | `{ message }`, session destroyed server-side | — |
| `changePassword(userId, current, new)` | Both passwords | `{ message }`, session id rotated | 400 wrong current password or weak new password |

`login` deliberately returns the same 401 message whether the email is unknown or the password
is wrong, and spends the same time on both, so the response cannot be used to discover which
email addresses have accounts (FR-002).

#### I-03 `IAccessControl` — Authorisation, used by every protected route

Four checks composed in order; each stops the request on failure.

| Operation | Input | Output | Errors |
|---|---|---|---|
| `requireAuth(req)` | Session | `req.user`, loaded fresh each request | 401 |
| `requireRole(...roles)` | Allowed roles | passes through | 403, written to the audit log |
| `requireDepartment({load, as})` | Record loader | `req[as]` = the record | 403 other department, 404 not found |
| `allow(rule)` | A rule from I-04 | passes through | 403 never permitted, 409 wrong status |

The user is reloaded from the database on every request rather than trusted from the session, so
a deactivated account or a changed role takes effect immediately.

#### I-04 `IEvidenceRules` — Workflow rules (pure functions, no I/O)

Each returns `null` when the action is allowed, or `{ status, message }` explaining the refusal.

| Operation | Allows | Refuses with |
|---|---|---|
| `viewRule(user, evidence)` | Viewing a record and its current file | 403 private draft, 403 other department |
| `draftRule(user, evidence)` | Edit, delete, submit | 403 not the author, 409 not a draft, 409 locked |
| `reviewRule(user, evidence)` | Approve, reject | 403 not this department's coordinator, 409 not pending |
| `resubmitRule(user, evidence)` | Resubmit after revision | 403 not the author, 409 not in Needs Revision |
| `oldVersionsRule(user, evidence)` | Download a superseded version | 403 for anyone but the coordinator and IQAC lead |
| `flagRule(user, evidence)` | Flag approved evidence for re-audit | 403 not the IQAC lead, 409 not approved |
| `permissionsFor(user, evidence)` | — | Returns the booleans the UI uses to decide its buttons |

#### I-05 `IFileStorage` — Application server → file system

| Operation | Input | Output | Errors |
|---|---|---|---|
| `fileInfoFromUpload(file)` | multer upload | `{ storedName, originalName, mimeType, sizeBytes }` | — |
| `storedFilePath(storedName)` | Stored name | Absolute path inside the evidence folder | — |
| `sendStoredFile(res, file, {download})` | File record | Streams bytes, supports range requests | 404 missing on disk |
| `deleteStoredFile(storedName)` | Stored name | — | — |

`storedFilePath` passes the name through `path.basename()`, so even a corrupted stored name
cannot escape the evidence folder. Files are addressed by **evidence id** in every API call;
the client never sees or supplies a path.

#### I-06 `IUploadValidator` — Incoming file validation

| Stage | Check | Failure message |
|---|---|---|
| 1 | Extension is `.pdf`, `.png`, `.jpg`, `.jpeg` | "Only PDF, PNG or JPG files are allowed." |
| 2 | Declared MIME type matches the extension | "Only PDF, PNG or JPG files are allowed." |
| 3 | Size ≤ 10 MB, enforced while streaming | "The file is larger than 10 MB." |
| 4 | First bytes match the type's signature | "This file is not a genuine PDF, PNG or JPG…" |

If any later step of a request fails after the file was stored, `discardUploadOnError` removes
it, so a rejected upload never leaves an orphan on disk.

#### I-07 `IAuditLogger` — Every component → audit trail

| Operation | Input | Output | Errors |
|---|---|---|---|
| `recordAudit(req, action, {user, email, evidence, details})` | The action and its context | Appends one entry | Logged to the server; never fails the caller's action |

A logging failure does not fail the user's action. Making the two atomic would require MongoDB
transactions and therefore a replica set, which this prototype's single local server does not
provide. This is a conscious trade-off, recorded in §7.

The collection is append-only: update and delete are blocked at the model level (NFR-019).

#### I-08 `IDataRepository` — Application server → MongoDB

Provided by Mongoose. Each model exposes the standard document operations; three of them
(`EvidenceVersion`, `Review`, `AuditLog`) have update and delete blocked by the `appendOnly`
plugin, which is how BR-006 and NFR-012 are guaranteed rather than merely intended.

### 3.3 Web API operation contract (I-01)

Authentication column: **—** none, **✓** any signed-in user, or the required role.

#### Authentication

| Method | Path | Auth | Request | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/auth/me` | — | — | 200 `{ user \| null }` | — |
| POST | `/api/auth/login` | — | `{ email, password }` | 200 `{ user }` | 400, 401, 429 |
| POST | `/api/auth/logout` | — | — | 200 `{ message }` | — |
| POST | `/api/auth/change-password` | ✓ | `{ currentPassword, newPassword }` | 200 `{ message }` | 400, 401 |

#### Reference data

| Method | Path | Auth | Success |
|---|---|---|---|
| GET | `/api/taxonomy` | ✓ | 200 `{ criteria[], subMetrics[], departments[], academicYears[] }` |
| GET | `/api/health` | — | 200 `{ status, database, serverTime }` |

#### UC-004 — Upload Evidence

| Method | Path | Auth | Request | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/evidence/mine` | Faculty | — | 200 `{ items[] }` | 401, 403 |
| POST | `/api/evidence` | Faculty | multipart: `intent`, `title`, `description`, `criterion`, `subMetric`, `academicYear`, `file` | 201 `{ message, evidence }` | 400, 401, 403 |
| PATCH | `/api/evidence/:id` | Faculty | As above | 200 `{ message, evidence }` | 400, 403, 404, 409 |
| DELETE | `/api/evidence/:id` | Faculty | — | 200 `{ message }` | 403, 404, 409 |
| POST | `/api/evidence/:id/submit` | Faculty | — | 200 `{ message, evidence }` | 400, 403, 404, 409 |
| POST | `/api/evidence/:id/resubmit` | Faculty | multipart, file optional | 200 `{ message, evidence }` | 400, 403, 404, 409 |

`intent` is `"draft"` or `"submit"`. `department` and `uploadedBy` are **not** accepted from the
request; both are set from the session (FR-017, AC-08).

On `resubmit`, a new file produces the next version (v1.1, v1.2 …) and the previous file is kept
in the version history (FR-031, BR-006). Correcting only the metadata keeps the version number.

#### UC-011 — Review Submitted Evidence

| Method | Path | Auth | Request | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/evidence/review-queue` | Coordinator | — | 200 `{ department, counts, items[] }` | 401, 403 |
| POST | `/api/evidence/:id/approve` | Coordinator | `{ comments? }` | 200 `{ message, evidence }` | 400, 403, 404, 409 |
| POST | `/api/evidence/:id/reject` | Coordinator | `{ comments }` **required** | 200 `{ message, evidence }` | 400, 403, 404, 409 |
| POST | `/api/evidence/:id/flag` | IQAC Lead | `{ comments }` **required** | 200 `{ message, evidence }` | 400, 403, 404, 409 |

#### UC-016 — Search and Filter Evidence

| Method | Path | Auth | Request | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/evidence` | ✓ | Query: `q`, `criterion`, `academicYear` (repeatable), `department`, `status`, `page` | 200 `{ items[], total, page, pageSize, totalPages, departmentRestricted, scopedDepartment }` | 400, 401 |
| GET | `/api/evidence/:id` | ✓ | — | 200 `{ evidence }` | 400, 403, 404 |
| GET | `/api/evidence/:id/file` | ✓ | `?download=1` optional | 200 file stream | 403, 404 |
| GET | `/api/evidence/:id/history` | ✓ | — | 200 `{ versions[], reviews[] }` | 403, 404 |
| GET | `/api/evidence/:id/versions/:versionId/file` | ✓ | — | 200 file stream | 403, 404 |

`departmentRestricted: true` is how the client knows to show the UC-016 alternative-flow notice
described in §2.6.

#### Supporting use cases

| Method | Path | Auth | Success |
|---|---|---|---|
| GET | `/api/dashboard/criteria` | IQAC Lead | 200 `{ criteria[], overall }` |
| GET | `/api/users` | Admin | 200 `{ users[] }` |
| POST | `/api/users` | Admin | 201 `{ message, user }` |
| GET | `/api/audit-logs` | Admin | 200 `{ items[], total, page, pageSize, totalPages }` |

### 3.4 Shared interface rules

| Rule | Specification |
|---|---|
| Status codes | 200 success · 201 created · 400 invalid input · 401 not signed in · 403 not permitted · 404 not found · 409 conflicts with current state · 429 rate-limited · 500 server fault |
| Error body | `{ message }`, plus `errors: [{ field, message }]` when individual fields failed |
| Field errors | `field` matches the form control's name, so the client can place each message without mapping |
| Session | `naac_sid`, HttpOnly, SameSite=Lax, 30-minute **inactivity** expiry refreshed on every request (FR-007) |
| CSRF | `X-CSRF-Token` must equal the `naac_csrf` cookie on every state-changing request; rotated at sign-in |
| Pagination | Search 10 per page; audit log 25 per page; both return `page`, `pageSize`, `total`, `totalPages` |
| Date format | ISO 8601 UTC in payloads; formatted for display by the client only |
| Identifiers | MongoDB ObjectId strings; an invalid one returns 400, not 500 |
| Never exposed | Password hashes and `storedName` are absent from every response |

### 3.5 How the interfaces carry each use case

**UC-004, submitting evidence**

```
EvidenceUploadUI
  → I-01 POST /api/evidence (multipart)
      → I-03 requireAuth → requireRole(FACULTY)
      → I-06 validate extension, MIME type, size, signature
      → I-05 fileInfoFromUpload
      → EvidenceManager: apply fields, check mandatory set
      → I-08 Evidence.save        (status PENDING_REVIEW, v1.0)
      → I-08 EvidenceVersion.create (v1.0, append-only)
      → I-07 recordAudit(EVIDENCE_CREATED), recordAudit(EVIDENCE_SUBMITTED)
  ← 201 { message, evidence }
```

**UC-011, rejecting with feedback**

```
ReviewDashboardUI
  → I-01 POST /api/evidence/:id/reject { comments }
      → I-03 requireAuth → requireRole(COORDINATOR)
            → requireDepartment (loads the record)
            → allow(reviewRule)        ← I-04
      → validators: comments must be non-empty   (FR-027, BR-005)
      → ReviewWorkflowManager: status = NEEDS_REVISION, store feedback
      → I-08 Evidence.save      (optimistic concurrency → 409 if overtaken)
      → I-08 Review.create      (append-only review trail)
      → I-07 recordAudit(EVIDENCE_REJECTED)
  ← 200 { message, evidence }
```

**UC-016, searching**

```
SearchFilterUI
  → I-01 GET /api/evidence?q=…&criterion=…&academicYear=…
      → I-03 requireAuth
      → validators: reject unknown status, year or page
      → SearchFilterEngine: build filter; force own department for scoped roles
      → I-08 countDocuments + find().skip().limit()
      → I-07 recordAudit(EVIDENCE_SEARCHED)   (page 1 only)
  ← 200 { items, total, page, totalPages, departmentRestricted, scopedDepartment }
```

### 3.6 External interfaces

| External system | Interface | Used for |
|---|---|---|
| MongoDB Community Server 8.0 | Mongoose over the MongoDB wire protocol, `mongodb://127.0.0.1:27017` | All persistent data, plus the session store |
| Local file system | Node `fs`, folder `backend/storage/evidence` | Uploaded evidence files, outside the web root |
| Web browser | HTTP, HTML, the browser's native PDF viewer | The user interface |

The SMTP mail server shown in the Assignment 5 component diagram is **not** part of this design.
Email is out of scope, so there is no notification interface; the faculty member sees review
feedback in the application instead.

---

## 4. Traceability

| Requirement | Interface element |
|---|---|
| FR-001, FR-002 | S-01; I-02 `login` |
| FR-003 | S-02 Sign out; I-02 `logout` |
| FR-007 | Session rules §3.4; S-01 expiry notice |
| FR-008 | S-02 role-based sidebar; I-03 `requireRole` |
| FR-009–011, AC-02/03 | S-04 file field, S-05 messages; I-06 |
| FR-012–016, AC-04–07 | S-04 fields; `POST /api/evidence` |
| FR-017, AC-08 | S-04 read-only department; server-set field |
| FR-018 | S-03 drafts only; I-04 `viewRule` |
| FR-019–021 | S-04, S-06 buttons; I-04 `draftRule` |
| FR-022 | S-03; `GET /api/evidence/mine` |
| FR-023 | S-07; `GET /api/evidence/review-queue` |
| FR-024, AC-02 | S-08 preview; `GET /api/evidence/:id/file` |
| FR-025, BR-004, AC-03 | S-10; I-04 `reviewRule`, `isLocked` |
| FR-026, FR-027, BR-005, AC-04 | S-09; required `comments` |
| FR-028, FR-031 | S-04 resubmit mode; `POST /:id/resubmit` |
| FR-029 | `POST /:id/flag`; I-04 `flagRule` |
| FR-030 | Status badges, §2.1 |
| FR-032 | S-06 version history; `GET /:id/history` |
| FR-033 | I-04 `oldVersionsRule` |
| FR-034–039 | S-11 filters; `GET /api/evidence` |
| FR-043, NFR-019 | I-07; append-only audit log |
| BR-001 | 401 on every route; `requireAuth` |
| BR-003 | I-06 |
| BR-006, NFR-012 | `EvidenceVersion` append-only |
| NFR-004–006 | I-03, I-04 |
| NFR-009 | §2.7 message catalogue |
| AC-09, AC-10 | S-06 status and confirmation |
| UC-016 alt. flows | S-12; `departmentRestricted` |

---

## 5. Interface design decisions

| # | Decision | Reason |
|---|---|---|
| 1 | One API gateway module in the client | The CSRF header, error shaping and session-expiry handling are written once instead of in every page |
| 2 | Workflow rules as pure functions used by both sides | The UI's buttons and the server's checks come from the same source, so the interface cannot offer an action the server would refuse |
| 3 | Files addressed by evidence id, never by path | A client cannot name a file, so path traversal is not reachable from the API |
| 4 | Manual Refresh on the review queue instead of polling | Automatic polling would keep resetting the 30-minute inactivity timer and defeat FR-007 |
| 5 | Department substituted server-side, with a notice | A hand-written request cannot reach another department either; the notice keeps the behaviour honest |
| 6 | Mandatory feedback blocked in the dialog *and* on the server | The dialog gives a fast answer; the server makes it a guarantee |
| 7 | Session cookie rather than a token in storage | HttpOnly keeps the credential out of reach of page scripts, and sign-out genuinely ends the session server-side |
| 8 | Errors carry `field` names matching form controls | The client places each message without a translation table between server and form |

## 6. Assumptions

1. **Sign-in is by email only.** FR-001 says "email or username", but the data model in SRS §16.1
   has no username attribute.
2. **Allowed file types are PDF, PNG and JPG.** SRS §7 also lists DOCX and XLSX, but FR-009,
   FR-010, FR-011, BR-003 and AC-02 all specify PDF/PNG/JPG. The more specific and more
   numerous statements were taken as authoritative.
3. **Faculty upload and coordinators review.** SRS §7 and §8 hint at coordinators uploading and
   the IQAC verifying; §11, UC-011 and every acceptance criterion describe faculty → coordinator.
4. **Four statuses are stored.** "Updated" and "Re-Submitted" in the §17 lifecycle diagram are
   transitions, not states.
5. **The academic-year list** is not fixed by the SRS and is configurable.

## 7. Known limitations

1. **The evidence record and its version entry are two separate writes.** Making them atomic
   needs MongoDB transactions, which require a replica set rather than a single local server. A
   crash between the two would leave a submitted record without its version row.
2. **Append-only is enforced in the application**, not by database permissions. Someone with
   direct database access could still alter history.
3. **Sign-in rate-limit counters are held in memory** and reset when the server restarts.
4. **No bulk export interface.** FR-041 is "Could Have" in the MoSCoW list (SRS §22) and is out
   of scope for this prototype.
5. **No email interface**, so password reset is handled by the administrator and review
   notifications are in-app only.

---

## 8. Wireframe index

All sheets are in [`diagrams/interfaces/`](diagrams/interfaces/). They are produced by
[`diagrams/generate-wireframes.py`](diagrams/generate-wireframes.py), so a label or message can
be corrected and every sheet regenerated consistently:

```
cd docs/design/assignment-06/diagrams
python generate-wireframes.py
```

The script needs only Pillow (`pip install pillow`).

| Sheet | File |
|---|---|
| UI-WF-01 Sign In | `UI-Wireframe-01-Sign-In.png` |
| UI-WF-02 Application shell and navigation | `UI-Wireframe-02-App-Shell-Navigation.png` |
| UI-WF-03 My Evidence | `UI-Wireframe-03-My-Evidence.png` |
| UI-WF-04 Upload Evidence | `UI-Wireframe-04-Upload-Evidence.png` |
| UI-WF-05 Upload validation and error states | `UI-Wireframe-05-Upload-Validation-Errors.png` |
| UI-WF-06 Evidence Detail | `UI-Wireframe-06-Evidence-Detail-Draft.png` |
| UI-WF-07 Review Queue | `UI-Wireframe-07-Review-Queue.png` |
| UI-WF-08 Review Evidence | `UI-Wireframe-08-Review-Evidence.png` |
| UI-WF-09 Reject dialog | `UI-Wireframe-09-Reject-Dialog.png` |
| UI-WF-10 Approve dialog | `UI-Wireframe-10-Approve-Dialog.png` |
| UI-WF-11 Search and filter results | `UI-Wireframe-11-Search-Results.png` |
| UI-WF-12 Search exceptional flows | `UI-Wireframe-12-Search-Exceptions.png` |
| Screen flow map | `Screen-Flow-Map.png` |
