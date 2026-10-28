// "May this user do this to this record right now?" Each rule returns null when the action is
// allowed, or { status, message }: 403 when this person may never do it, 409 when the record's
// current status forbids it.
//
// The routes enforce these through allow(), and the detail endpoint runs the same functions to
// decide which buttons the page may show, so the UI can never offer an action the server refuses.
import { EVIDENCE_STATUS, EVIDENCE_STATUS_LABELS, ROLES } from '../config/constants.js';
import { canAccessDepartment } from '../middleware/auth.js';

const { DRAFT, PENDING_REVIEW, APPROVED, NEEDS_REVISION } = EVIDENCE_STATUS;

// Works whether the reference is a plain id or an already-populated document.
const idOf = (value) => String(value?._id ?? value);

export function isAuthor(user, evidence) {
  return idOf(evidence.uploadedBy) === idOf(user._id);
}

// FR-018: a draft is private to its author. Anything else is visible to whoever's department
// scope covers it.
export function viewRule(user, evidence) {
  if (evidence.status === DRAFT && !isAuthor(user, evidence)) {
    return { status: 403, message: 'This draft is private to the faculty member who created it.' };
  }
  if (!canAccessDepartment(user, idOf(evidence.department))) {
    return { status: 403, message: 'This record belongs to another department.' };
  }
  return null;
}

// FR-019, FR-020, FR-021: editing, deleting and submitting belong to the author while the record
// is still a draft. FR-025 and BR-004 lock an approved record against every change.
export function draftRule(user, evidence) {
  if (user.role !== ROLES.FACULTY || !isAuthor(user, evidence)) {
    return { status: 403, message: 'Only the faculty member who created this evidence can change it.' };
  }
  if (evidence.status === APPROVED || evidence.isLocked) {
    return { status: 409, message: 'This evidence is approved and locked, so it can no longer be changed.' };
  }
  if (evidence.status !== DRAFT) {
    return { status: 409, message: `Only drafts can be changed or deleted. This record is "${EVIDENCE_STATUS_LABELS[evidence.status]}".` };
  }
  return null;
}

// UC-011: a coordinator of the record's own department, while it is waiting for review.
export function reviewRule(user, evidence) {
  if (user.role !== ROLES.COORDINATOR || !canAccessDepartment(user, idOf(evidence.department))) {
    return { status: 403, message: "Only a coordinator of this record's department can review it." };
  }
  if (evidence.status !== PENDING_REVIEW) {
    return { status: 409, message: `This record is not waiting for review. It is "${EVIDENCE_STATUS_LABELS[evidence.status]}".` };
  }
  return null;
}

// FR-028, FR-031: the author, while the record needs revision.
export function resubmitRule(user, evidence) {
  if (user.role !== ROLES.FACULTY || !isAuthor(user, evidence)) {
    return { status: 403, message: 'Only the faculty member who created this evidence can resubmit it.' };
  }
  if (evidence.status !== NEEDS_REVISION) {
    return { status: 409, message: `Only evidence that needs revision can be resubmitted. This record is "${EVIDENCE_STATUS_LABELS[evidence.status]}".` };
  }
  return null;
}

// FR-033, UC-015: downloading OLDER versions is limited to the record's own coordinator and the
// IQAC lead. Everyone who can see the record still sees the timeline and the current file.
export function oldVersionsRule(user, evidence) {
  const isOwnCoordinator = user.role === ROLES.COORDINATOR && canAccessDepartment(user, idOf(evidence.department));
  if (isOwnCoordinator || user.role === ROLES.IQAC_LEAD) return null;
  return { status: 403, message: 'Only the department coordinator and the IQAC lead can download older versions.' };
}

// FR-029: the IQAC lead sends approved evidence back to "Needs revision" and unlocks it.
export function flagRule(user, evidence) {
  if (user.role !== ROLES.IQAC_LEAD) {
    return { status: 403, message: 'Only the IQAC lead can flag evidence for re-audit.' };
  }
  if (evidence.status !== APPROVED) {
    return { status: 409, message: `Only approved evidence can be flagged for re-audit. This record is "${EVIDENCE_STATUS_LABELS[evidence.status]}".` };
  }
  return null;
}

// Which action buttons the detail page may show this user.
export function permissionsFor(user, evidence) {
  const draftActionsAllowed = draftRule(user, evidence) === null;
  return {
    canEdit: draftActionsAllowed,
    canDelete: draftActionsAllowed,
    canSubmit: draftActionsAllowed,
    canResubmit: resubmitRule(user, evidence) === null,
    canReview: reviewRule(user, evidence) === null,
    canFlag: flagRule(user, evidence) === null,
    canDownloadOldVersions: oldVersionsRule(user, evidence) === null,
  };
}
