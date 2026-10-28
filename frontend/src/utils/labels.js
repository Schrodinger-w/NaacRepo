// Human-readable names for the codes the API uses. Changing a label here changes it everywhere.

export const ROLE_LABELS = {
  FACULTY: 'Faculty',
  COORDINATOR: 'Department Coordinator',
  IQAC_LEAD: 'IQAC Lead',
  ADMIN: 'System Administrator',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}

// FR-030: the wording on every status badge.
export const STATUS_LABELS = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending review',
  APPROVED: 'Approved',
  NEEDS_REVISION: 'Needs revision',
};

// How a review decision reads in the version history timeline.
export const DECISION_LABELS = {
  APPROVED: 'Approved',
  NEEDS_REVISION: 'Sent back for revision',
  FLAGGED_FOR_REAUDIT: 'Flagged for re-audit',
};

// Audit-log actions in plain words, for the admin's viewer.
export const ACTION_LABELS = {
  LOGIN_SUCCESS: 'Signed in',
  LOGIN_FAILED: 'Sign-in failed',
  LOGOUT: 'Signed out',
  PASSWORD_CHANGED: 'Changed password',
  ACCESS_DENIED: 'Access denied',
  EVIDENCE_CREATED: 'Created evidence',
  EVIDENCE_UPDATED: 'Edited a draft',
  EVIDENCE_DELETED: 'Deleted a draft',
  EVIDENCE_SUBMITTED: 'Submitted for review',
  EVIDENCE_RESUBMITTED: 'Resubmitted',
  EVIDENCE_APPROVED: 'Approved',
  EVIDENCE_REJECTED: 'Sent back for revision',
  EVIDENCE_FLAGGED: 'Flagged for re-audit',
  FILE_VIEWED: 'Viewed a file',
  FILE_DOWNLOADED: 'Downloaded a file',
  EVIDENCE_SEARCHED: 'Searched',
  USER_CREATED: 'Created a user',
};

// "1.0" -> "v1.0". A record that was never submitted has no version at all.
export function versionLabel(version) {
  return version ? `v${version}` : 'Not submitted';
}
