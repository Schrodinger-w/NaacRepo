// The faculty side of the workflow: list, create, view, edit, delete and submit evidence
// (FR-009 to FR-022, UC-004 to UC-009). Sign-in, role, department and the action rule have all
// been checked by the time these run; see routes/evidence.routes.js for the chain.
import Evidence from '../models/Evidence.js';
import EvidenceVersion from '../models/EvidenceVersion.js';
import Criterion from '../models/Criterion.js';
import { AUDIT_ACTIONS, EVIDENCE_STATUS } from '../config/constants.js';
import { HttpError } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAudit } from '../services/audit.service.js';
import { fileInfoFromUpload, deleteStoredFile } from '../services/fileStorage.js';
import { EVIDENCE_POPULATE, toEvidenceSummary, sendEvidence } from '../services/evidencePresenter.js';

// An empty form field arrives as "": treat it as "not chosen".
const chosenOrUndefined = (value) => (value === '' || value === undefined ? undefined : value);

// FR-017, AC-08: department and author are deliberately absent here. They are set once, from
// the signed-in account, so nothing a client sends can change them.
function applyFormFields(evidence, body, uploadedFile) {
  evidence.title = body.title;
  evidence.description = body.description ?? '';
  evidence.criterion = chosenOrUndefined(body.criterion);
  evidence.subMetric = chosenOrUndefined(body.subMetric);
  evidence.academicYear = chosenOrUndefined(body.academicYear);
  if (uploadedFile) evidence.currentFile = fileInfoFromUpload(uploadedFile);
}

// UC-004 alternative flows: everything required before a record may leave DRAFT.
function missingForSubmission(evidence) {
  const missing = [];
  if (!evidence.criterion) missing.push({ field: 'criterion', message: 'Choose a NAAC criterion.' });
  if (!evidence.subMetric) missing.push({ field: 'subMetric', message: 'Choose a sub-metric.' });
  if (!evidence.academicYear) missing.push({ field: 'academicYear', message: 'Choose an academic year.' });
  if (!evidence.currentFile) missing.push({ field: 'file', message: 'Attach the evidence file (PDF, PNG or JPG).' });
  return missing;
}

// Checked here rather than in the model so every problem comes back at once, under the form's
// own field names. The model still enforces AC-06 on save.
async function checkFields(evidence, submitting) {
  const problems = submitting ? missingForSubmission(evidence) : [];
  if (evidence.criterion && !(await Criterion.exists({ _id: evidence.criterion, isActive: true }))) {
    problems.push({ field: 'criterion', message: 'Choose a valid NAAC criterion.' });
  }
  if (problems.length > 0) {
    const message = submitting ? 'Complete the highlighted fields before submitting.' : 'Please correct the highlighted fields.';
    throw new HttpError(400, message, problems);
  }
}

// FR-021: a complete record enters the review queue as v1.0, and its file becomes the first
// entry of the version history. Two separate writes, because making them atomic would need
// MongoDB transactions and therefore a replica set.
async function submitForReview(evidence, user) {
  evidence.status = EVIDENCE_STATUS.PENDING_REVIEW;
  evidence.currentVersion = '1.0';
  await evidence.save();
  await EvidenceVersion.create({
    evidence: evidence._id,
    versionNumber: '1.0',
    file: evidence.currentFile,
    uploadedBy: user._id,
  });
}

// GET /api/evidence/mine: the faculty member's own records, newest first, drafts included (FR-022).
export const listMyEvidence = asyncHandler(async (req, res) => {
  const records = await Evidence.find({ uploadedBy: req.user._id })
    .populate(EVIDENCE_POPULATE)
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ items: records.map(toEvidenceSummary) });
});

// GET /api/evidence/:id: one record, with the actions this user may take on it.
export const getEvidence = asyncHandler(async (req, res) => {
  await sendEvidence(res, req.evidence, req.user);
});

// POST /api/evidence (multipart form): save a new record as a draft, or create and submit it
// in one step (intent = "draft" or "submit"; UC-004, UC-005).
export const createEvidence = asyncHandler(async (req, res) => {
  const submitting = req.body.intent === 'submit';
  const evidence = new Evidence({
    department: req.user.department._id, // FR-017: the uploader's own, never the request's
    uploadedBy: req.user._id,
    status: EVIDENCE_STATUS.DRAFT,
  });
  applyFormFields(evidence, req.body, req.file);
  await checkFields(evidence, submitting);

  if (submitting) await submitForReview(evidence, req.user);
  else await evidence.save();

  await recordAudit(req, AUDIT_ACTIONS.EVIDENCE_CREATED, { evidence, details: { title: evidence.title } });
  if (submitting) await recordAudit(req, AUDIT_ACTIONS.EVIDENCE_SUBMITTED, { evidence, details: { version: '1.0' } });

  await sendEvidence(res, evidence, req.user, {
    status: 201,
    message: submitting ? 'Evidence submitted for review.' : 'Draft saved.',
  });
});

// PATCH /api/evidence/:id (multipart form): change a draft's details and/or replace its file
// (FR-019), optionally submitting it in the same step.
export const updateEvidence = asyncHandler(async (req, res) => {
  const evidence = req.evidence;
  const submitting = req.body.intent === 'submit';
  const replacedFile = req.file && evidence.currentFile ? evidence.currentFile.storedName : null;

  applyFormFields(evidence, req.body, req.file);
  await checkFields(evidence, submitting);

  if (submitting) await submitForReview(evidence, req.user);
  else await evidence.save();

  // Safe to delete: a draft's old file was never part of a submitted version, so no version
  // history entry refers to it.
  if (replacedFile) await deleteStoredFile(replacedFile);

  await recordAudit(req, AUDIT_ACTIONS.EVIDENCE_UPDATED, { evidence, details: { fileReplaced: Boolean(req.file) } });
  if (submitting) await recordAudit(req, AUDIT_ACTIONS.EVIDENCE_SUBMITTED, { evidence, details: { version: '1.0' } });

  await sendEvidence(res, evidence, req.user, {
    message: submitting ? 'Evidence submitted for review.' : 'Draft saved.',
  });
});

// DELETE /api/evidence/:id: permanently delete a draft and its file (FR-020).
export const deleteEvidence = asyncHandler(async (req, res) => {
  const evidence = req.evidence;
  await evidence.deleteOne();
  if (evidence.currentFile) await deleteStoredFile(evidence.currentFile.storedName);
  await recordAudit(req, AUDIT_ACTIONS.EVIDENCE_DELETED, { evidence, details: { title: evidence.title } });
  res.json({ message: 'Draft deleted.' });
});

// POST /api/evidence/:id/resubmit (multipart form): fix a record that was sent back and return
// it to the review queue (FR-028). A new file creates the next version and the previous file
// stays on disk in the version history (FR-031, BR-006, NFR-012); correcting only the metadata
// keeps the current version number.
export const resubmitEvidence = asyncHandler(async (req, res) => {
  const evidence = req.evidence;
  applyFormFields(evidence, req.body, req.file);
  await checkFields(evidence, true);

  if (req.file) {
    // Versions start at v1.0, so the count so far is the next minor number.
    const versionsSoFar = await EvidenceVersion.countDocuments({ evidence: evidence._id });
    evidence.currentVersion = `1.${versionsSoFar}`;
  }
  evidence.status = EVIDENCE_STATUS.PENDING_REVIEW;
  evidence.isLocked = false;
  await evidence.save();

  if (req.file) {
    await EvidenceVersion.create({
      evidence: evidence._id,
      versionNumber: evidence.currentVersion,
      file: evidence.currentFile,
      uploadedBy: req.user._id,
    });
  }

  await recordAudit(req, AUDIT_ACTIONS.EVIDENCE_RESUBMITTED, {
    evidence,
    details: { version: evidence.currentVersion, newFile: Boolean(req.file) },
  });
  await sendEvidence(res, evidence, req.user, {
    message: req.file
      ? `Resubmitted for review as v${evidence.currentVersion}. The previous file is kept in the version history.`
      : `Resubmitted for review. The file did not change, so it stays v${evidence.currentVersion}.`,
  });
});

// POST /api/evidence/:id/submit: send an existing draft for review exactly as it is (FR-021).
export const submitEvidence = asyncHandler(async (req, res) => {
  const evidence = req.evidence;
  await checkFields(evidence, true);
  await submitForReview(evidence, req.user);
  await recordAudit(req, AUDIT_ACTIONS.EVIDENCE_SUBMITTED, { evidence, details: { version: '1.0' } });
  await sendEvidence(res, evidence, req.user, { message: 'Evidence submitted for review.' });
});
