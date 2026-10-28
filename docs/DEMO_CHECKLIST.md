# NAAC Evidence Repository: demonstration and manual test checklist

CS314 Software Development Laboratory, Team T095. Use this sheet during the demo: tick each box
as the instructor sees the expected result. Requirement IDs refer to our SRS (Lab Assignments 1-4).

## 1. Before the demo (about 5 minutes)

- [ ] MongoDB is running. In PowerShell: `Get-Service MongoDB` shows `Running`.
- [ ] Start from clean demo data. In `backend`: `npm run seed:reset`.
      **This deletes every record and every uploaded file**, then recreates the 4 departments, 7 criteria,
      27 demo sub-metrics and the 4 demo accounts.
- [ ] Terminal 1, in `backend`: `npm run dev`. It shows `MongoDB connected` and `API ready`.
- [ ] Terminal 2, in `frontend`: `npm run dev`. It shows `Local: http://localhost:5173/`.
- [ ] Two PDF files ready on the desktop, for example `IPR_Workshop_Report.pdf` (first upload) and
      `IPR_Workshop_Report_corrected.pdf` (the fix). Any PDFs under 10 MB will do.
- [ ] Optional, for the session-timeout demo: set `SESSION_IDLE_MINUTES=1` in `backend\.env` and restart
      the backend. Set it back to `30` afterwards.

### Demo accounts (password for all four: `Demo@123`)

| Role | Email | Department |
|---|---|---|
| Faculty | ananya.rao@lnmiit.test | CSE |
| Department Coordinator | vikram.mehta@lnmiit.test | CSE |
| IQAC Lead | sunita.krishnan@lnmiit.test | - |
| System Administrator | rahul.verma@lnmiit.test | - |

## 2. The end-to-end scenario (about 10 minutes)

Use **Sign out** (top right) between roles. Each role lands on its own home page.

| # | Who | Do this | The instructor should see | SRS |
|---|---|---|---|---|
| 1 | Faculty | Sign in. Click **Upload evidence**. Enter a title, choose criterion **3**, sub-metric **3.2.1**, year **2025-26**, attach the first PDF. | The sub-metric list only shows criterion 3's sub-metrics. Department "CSE" is filled in automatically. | FR-009 to FR-017, AC-06, AC-08 |
| 2 | Faculty | Click **Save as draft**. Then click **Submit for review** and confirm. | "Draft saved." with the **Draft** badge (grey); after submitting, "Evidence submitted for review." with **Pending review** (amber) and **v1.0**. | FR-018, FR-021, AC-09, AC-10 |
| 3 | Coordinator | Sign in (lands on **Review queue**). Click **Review**. The PDF preview appears. Click **Reject** and try with an empty box, then type feedback and confirm. | The submission is in the queue with the department totals. The empty rejection is blocked. Afterwards: **Needs revision** (red) and the feedback. | FR-023 to FR-027, UC-011, AC-04 |
| 4 | Faculty | Sign in. See **Needs your attention** with the feedback. Click **Revise and resubmit**, upload the corrected PDF, click **Resubmit for review**. | The feedback is shown on the form. Message: "Resubmitted for review as v1.1. The previous file is kept in the version history." | FR-028, AC-06 |
| 5 | Faculty | On the record, scroll to **Version history**. | v1.0 and v1.1 (Current) are both listed with times; the old v1.0 file is kept. | FR-031, FR-032, BR-006 |
| 6 | Coordinator | Sign in, open the record from the queue, click **Approve** and confirm. Then sign in as faculty and open the record. | **Approved** (green), "The record is locked". The faculty member has no Edit or Delete buttons any more. | FR-025, BR-004, AC-03 |
| 7 | Any user | Click **Search evidence**, type `workshop`, tick **2025-26**, click **Search**. Open the result. | The record is found; details, status, version and the full history are shown. As coordinator, v1.0 can still be downloaded. | FR-034 to FR-039, UC-016, FR-033 |
| 8 | IQAC Lead | Sign in (lands on **Dashboard**). | Criterion 3 shows **25%** (1 of 4 sub-metrics has approved evidence) and its submission counts. Click **View the evidence for criterion 3** to open the filtered list. | FR-040, US-008 AC-01 to AC-05 |
| 9 | Admin | Sign in (lands on **Users**). Click **Audit log**. | Every step above, newest first: sign-ins, creation, submission, preview, rejection, resubmission, approval, searches, with who, when and IP. | FR-043, NFR-007, NFR-019 |

## 3. Extra demonstrations (pick any)

### Security and access control

- [ ] **Wrong password and unknown email** give the same message: "Invalid email or password." (FR-002)
- [ ] **Login rate limit:** 5 wrong passwords for a made-up email; the 6th attempt says "Too many failed
      sign-in attempts". Restart the backend to clear it.
- [ ] **Role check on the server:** signed in as faculty, open http://localhost:5173/api/users. The response
      is `{"message":"You do not have permission to do this."}` (403). It appears in the audit log as
      "Access denied". (FR-008, NFR-005)
- [ ] **Department restriction:** as faculty, search with Department = ECE. Only CSE records come back,
      with a notice. (UC-016 alternative flow)
- [ ] **Drafts are private:** a faculty draft cannot be opened by the coordinator, the IQAC lead or the admin.
      Paste its address while signed in as one of them: "You do not have access to this record." (FR-018)
- [ ] **Old versions:** signed in as faculty, the v1.0 entry in the history has no Download link; only the
      coordinator and the IQAC lead can download older versions. (FR-033)
- [ ] **Session timeout:** with `SESSION_IDLE_MINUTES=1`, sign in, wait over a minute, then click any
      action. The app returns to the sign-in page saying you were signed out after inactivity. (FR-007)

### File rules

- [ ] Choosing a `.docx` or `.xlsx` shows "Only PDF, PNG or JPG files are allowed." straight away. (AC-02)
- [ ] A file over 10 MB shows "The file is larger than 10 MB." (FR-011, AC-03)
- [ ] A text file renamed to `.pdf` is refused by the server, which checks the file's first bytes.
- [ ] Submitting with only a title lists every missing field. A draft with only a title saves fine. (UC-004)

### IQAC and admin

- [ ] **Re-audit flag:** as the IQAC lead, open the approved record and click **Flag for re-audit**. An empty
      reason is blocked; with a reason the record becomes **Needs revision** and is unlocked, and the
      dashboard percentage drops. After the faculty member resubmits, it returns to the coordinator. (FR-029)
- [ ] **Create user:** as admin, click **Create user**, choose Department Coordinator (a department field
      appears), try an existing email (refused), then a new one. The new person can sign in. (FR-042)
- [ ] **Audit log filters:** filter by action, part of an email and a date range; filters combine. (UC-021)
- [ ] **Criteria and sub-metrics:** read-only list, marked as demo values.

## 4. Manual test checklist

Run before the viva. Record Pass/Fail and the date.

| ID | Requirement | Test | Expected result | Pass/Fail |
|---|---|---|---|---|
| T01 | FR-001 | Sign in with each demo account | Each lands on its role's home page | |
| T02 | FR-002 | Wrong password; unknown email | Same generic message for both | |
| T03 | FR-003 | Sign out, then press Back and refresh | Returns to the sign-in page; the old session no longer works | |
| T04 | FR-004 | Change password with a wrong current password; then correctly | Error on that field; then "Your password has been changed." | |
| T05 | FR-005 | Open My profile | Name, email, phone, role, department shown | |
| T06 | FR-007 | Idle past `SESSION_IDLE_MINUTES` | Next action returns to sign-in with the inactivity message | |
| T07 | FR-008 | Compare the menu for all four roles | Each role sees only its own pages | |
| T08 | FR-009/010/011 | Upload PDF, PNG, JPG; then DOCX and a file over 10 MB | First three accepted; others refused with a clear message | |
| T09 | FR-014/015, AC-06 | Change the criterion after picking a sub-metric | The sub-metric resets; only that criterion's sub-metrics are offered | |
| T10 | FR-017, AC-08 | Check the department on a new record | Always the uploader's own department | |
| T11 | FR-018/019/020 | Save a draft, edit it (replace the file), delete it | Each works; delete asks for confirmation | |
| T12 | FR-021, AC-09 | Submit a complete draft | Pending review, v1.0, confirmation message | |
| T13 | FR-023 | Coordinator opens Review queue | Only own department's pending submissions, oldest first | |
| T14 | FR-024 | Open a PDF and an image submission | Preview shows in the page; Download works | |
| T15 | FR-025, BR-004 | Approve; faculty tries to change it | Approved and locked; no edit or delete possible | |
| T16 | FR-026/027, AC-04 | Reject with an empty comment, then with feedback | Blocked; then Needs revision with feedback | |
| T17 | FR-028, FR-031 | Resubmit with a new file; then with details only | v1.1 created; details-only keeps the version | |
| T18 | FR-029 | IQAC flags approved evidence | Needs revision, unlocked, reason visible to faculty | |
| T19 | FR-030 | Look at badges on all lists | Text plus colour everywhere | |
| T20 | FR-032/033 | View history as faculty and as coordinator | Both see the timeline; only coordinator/IQAC download v1.0 | |
| T21 | FR-034 | Search a word that is only in a description | Found | |
| T22 | FR-035/036/038/039 | Combine criterion + two years + status | Only matching records | |
| T23 | FR-037, UC-016 | Faculty filters by another department | Own department only, with a notice | |
| T24 | UC-016 | Search with filters that match nothing; more than 10 results | "No results found"; Previous/Next pages | |
| T25 | FR-040, US-008 | IQAC dashboard after an approval | Percentage and counts update; click-through filters search | |
| T26 | FR-042 | Admin creates a user; duplicate email | Created; duplicate refused | |
| T27 | FR-043 | Admin audit log after the scenario | Every action listed with user, time and IP | |
| T28 | BR-001 | Open http://localhost:5173/api/evidence while signed out | `{"message":"Please sign in to continue."}` | |

## 5. Where things are in the code (for viva questions)

| Question | File |
|---|---|
| How is a request checked (login, role, department, action)? | `backend/src/routes/evidence.routes.js`, `backend/src/middleware/auth.js` |
| Who may do what to a record? | `backend/src/services/evidenceRules.js` |
| How are uploads validated? | `backend/src/middleware/upload.js` |
| How do versions work? | `resubmitEvidence` in `backend/src/controllers/evidence.controller.js`, `models/EvidenceVersion.js` |
| How is search restricted by department? | `backend/src/controllers/search.controller.js` |
| How is completion % calculated? | `backend/src/controllers/dashboard.controller.js` |
| How does CSRF protection work? | `backend/src/middleware/csrf.js`, `frontend/src/api/client.js` |
| How does the 30-minute timeout work? | `backend/src/middleware/session.js` (`rolling: true`, `maxAge`) |
| Why can't the audit log be edited? | `backend/src/models/plugins/appendOnly.js` |
| Where are passwords hashed? | `backend/src/utils/password.js` |
| How does the UI know which buttons to show? | `permissionsFor` in `evidenceRules.js`, used by `EvidenceDetailPage.jsx` |

## 6. Known limits (say so if asked)

- Completion % is a prototype metric, and the sub-metric codes are demo values, not the official NAAC taxonomy.
- Not built (agreed scope): ZIP export, emails and password-reset links, admin password reset or role change,
  editing criteria, mobile app.
- MongoDB runs as a single local server, so the record and its version entry are two separate writes
  (transactions would need a replica set).
- The append-only rule is enforced by the app; someone with direct database access could still edit data.
- Login rate-limit counts live in memory and reset when the backend restarts.
