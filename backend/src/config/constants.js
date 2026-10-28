// Every fixed list in one place, so models, routes and the seed script can never disagree
// about how a role, status or action is spelled.

export const ROLES = Object.freeze({
  FACULTY: 'FACULTY',
  COORDINATOR: 'COORDINATOR',
  IQAC_LEAD: 'IQAC_LEAD',
  ADMIN: 'ADMIN',
});
export const ROLE_LIST = Object.values(ROLES);

// These two roles see only their own department's evidence; the IQAC lead and the admin
// work across the whole institution.
export const DEPARTMENT_SCOPED_ROLES = [ROLES.FACULTY, ROLES.COORDINATOR];

// "Updated" and "Re-Submitted" in the SRS lifecycle diagram are transitions between these
// four, not statuses of their own, so they are not stored.
export const EVIDENCE_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  NEEDS_REVISION: 'NEEDS_REVISION',
});
export const EVIDENCE_STATUS_LIST = Object.values(EVIDENCE_STATUS);

// User-facing wording for the statuses above.
export const EVIDENCE_STATUS_LABELS = Object.freeze({
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending review',
  APPROVED: 'Approved',
  NEEDS_REVISION: 'Needs revision',
});

// FLAGGED_FOR_REAUDIT is the IQAC lead sending approved evidence back to Needs Revision (FR-029).
export const REVIEW_DECISIONS = Object.freeze({
  APPROVED: 'APPROVED',
  NEEDS_REVISION: 'NEEDS_REVISION',
  FLAGGED_FOR_REAUDIT: 'FLAGGED_FOR_REAUDIT',
});
export const REVIEW_DECISION_LIST = Object.values(REVIEW_DECISIONS);

// The SRS does not fix this list; changing it here changes the forms and filters everywhere.
export const ACADEMIC_YEARS = ['2022-23', '2023-24', '2024-25', '2025-26', '2026-27'];

// FR-009 to FR-011, BR-003, AC-02, AC-03: PDF, PNG or JPG only, at most 10 MB.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = Object.freeze({
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
});
export const ALLOWED_MIME_TYPES = [...new Set(Object.values(ALLOWED_FILE_TYPES))];

// FR-043, NFR-007, NFR-019.
export const AUDIT_ACTIONS = Object.freeze({
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  EVIDENCE_CREATED: 'EVIDENCE_CREATED',
  EVIDENCE_UPDATED: 'EVIDENCE_UPDATED',
  EVIDENCE_DELETED: 'EVIDENCE_DELETED',
  EVIDENCE_SUBMITTED: 'EVIDENCE_SUBMITTED',
  EVIDENCE_RESUBMITTED: 'EVIDENCE_RESUBMITTED',
  EVIDENCE_APPROVED: 'EVIDENCE_APPROVED',
  EVIDENCE_REJECTED: 'EVIDENCE_REJECTED',
  EVIDENCE_FLAGGED: 'EVIDENCE_FLAGGED',
  FILE_VIEWED: 'FILE_VIEWED',
  FILE_DOWNLOADED: 'FILE_DOWNLOADED',
  EVIDENCE_SEARCHED: 'EVIDENCE_SEARCHED',
  USER_CREATED: 'USER_CREATED',
});
export const AUDIT_ACTION_LIST = Object.values(AUDIT_ACTIONS);
