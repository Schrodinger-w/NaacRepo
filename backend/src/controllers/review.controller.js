// Review decisions: the coordinator's queue, approve and reject (UC-010, UC-011), and the IQAC
// lead's re-audit flag (UC-013, FR-029). All three share recordDecision below.
import Evidence from '../models/Evidence.js';
import Review from '../models/Review.js';
import { AUDIT_ACTIONS, EVIDENCE_STATUS, REVIEW_DECISIONS } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAudit } from '../services/audit.service.js';
import { EVIDENCE_POPULATE, toEvidenceSummary, sendEvidence } from '../services/evidencePresenter.js';

// GET /api/evidence/review-queue: pending submissions from the coordinator's own department,
// oldest first, with the department's totals per status (FR-023).
// Read fresh on every request. The page has a Refresh button rather than polling, because
// polling would keep resetting the 30-minute inactivity timeout (FR-007).
export const listReviewQueue = asyncHandler(async (req, res) => {
  const department = req.user.department._id;

  const [pending, statusCounts] = await Promise.all([
    Evidence.find({ department, status: EVIDENCE_STATUS.PENDING_REVIEW })
      .populate(EVIDENCE_POPULATE)
      // A pending record cannot be edited, so updatedAt is still the moment it was submitted.
      .sort({ updatedAt: 1 })
      .lean(),
    Evidence.aggregate([
      { $match: { department, status: { $ne: EVIDENCE_STATUS.DRAFT } } }, // drafts are private (FR-018)
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const counts = { PENDING_REVIEW: 0, APPROVED: 0, NEEDS_REVISION: 0 };
  for (const row of statusCounts) counts[row._id] = row.count;

  res.json({ department: req.user.department, counts, items: pending.map(toEvidenceSummary) });
});

// Updates the record and appends to the permanent review trail.
async function recordDecision(req, decision, comments) {
  const evidence = req.evidence;
  const approved = decision === REVIEW_DECISIONS.APPROVED;

  evidence.status = approved ? EVIDENCE_STATUS.APPROVED : EVIDENCE_STATUS.NEEDS_REVISION;
  evidence.isLocked = approved; // FR-025: approval locks the record against faculty edits
  evidence.lastFeedback = comments;
  evidence.lastReviewedBy = req.user._id;
  evidence.lastReviewedAt = new Date();
  // If another coordinator decided a moment earlier, this fails with 409 rather than
  // overwriting them (optimisticConcurrency in models/Evidence.js).
  await evidence.save();

  await Review.create({
    evidence: evidence._id,
    reviewer: req.user._id,
    decision,
    comments,
    reviewedAt: evidence.lastReviewedAt,
  });
  return evidence;
}

// POST /api/evidence/:id/approve  { comments? }  (FR-025)
export const approveEvidence = asyncHandler(async (req, res) => {
  const evidence = await recordDecision(req, REVIEW_DECISIONS.APPROVED, req.body.comments || '');
  await recordAudit(req, AUDIT_ACTIONS.EVIDENCE_APPROVED, { evidence, details: { version: evidence.currentVersion } });
  await sendEvidence(res, evidence, req.user, { message: 'Evidence approved and locked.' });
});

// POST /api/evidence/:id/reject  { comments }  (FR-026, FR-027, BR-005)
// An empty comment has already been refused with 400 by the route's validators.
export const rejectEvidence = asyncHandler(async (req, res) => {
  const evidence = await recordDecision(req, REVIEW_DECISIONS.NEEDS_REVISION, req.body.comments);
  await recordAudit(req, AUDIT_ACTIONS.EVIDENCE_REJECTED, {
    evidence,
    details: { version: evidence.currentVersion, feedback: req.body.comments },
  });
  await sendEvidence(res, evidence, req.user, { message: 'Evidence sent back to the faculty member for revision.' });
});

// POST /api/evidence/:id/flag  { comments }  (FR-029)
// APPROVED -> NEEDS_REVISION, unlocked. The faculty member then resubmits and it returns to the
// department coordinator's queue for a fresh review.
export const flagEvidence = asyncHandler(async (req, res) => {
  const evidence = await recordDecision(req, REVIEW_DECISIONS.FLAGGED_FOR_REAUDIT, req.body.comments);
  await recordAudit(req, AUDIT_ACTIONS.EVIDENCE_FLAGGED, {
    evidence,
    details: { version: evidence.currentVersion, reason: req.body.comments },
  });
  await sendEvidence(res, evidence, req.user, {
    message: 'Flagged for re-audit. The record is unlocked and back with the faculty member as "Needs revision".',
  });
});
