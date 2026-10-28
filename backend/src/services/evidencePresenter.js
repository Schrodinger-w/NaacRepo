// Exactly what the API sends to the browser about an evidence record. Internal details such as
// the file's name on disk never appear here; files are fetched by evidence id instead.
import { permissionsFor } from './evidenceRules.js';

// Loaded on every path that returns evidence, so the shapes below always have what they need.
export const EVIDENCE_POPULATE = [
  { path: 'criterion', select: 'number name' },
  { path: 'subMetric', select: 'code name' },
  { path: 'department', select: 'code name' },
  { path: 'uploadedBy', select: 'name email' },
  { path: 'lastReviewedBy', select: 'name' },
];

function pick(doc, fields) {
  if (!doc) return null;
  return Object.fromEntries(['_id', ...fields].map((field) => [field, doc[field]]));
}

// For tables and lists.
export function toEvidenceSummary(evidence) {
  return {
    _id: evidence._id,
    title: evidence.title,
    status: evidence.status,
    criterion: pick(evidence.criterion, ['number', 'name']),
    subMetric: pick(evidence.subMetric, ['code', 'name']),
    academicYear: evidence.academicYear || '',
    department: pick(evidence.department, ['code', 'name']),
    uploadedBy: pick(evidence.uploadedBy, ['name']),
    currentVersion: evidence.currentVersion || '',
    isLocked: evidence.isLocked,
    hasFile: Boolean(evidence.currentFile),
    lastFeedback: evidence.lastFeedback || '',
    lastReviewedAt: evidence.lastReviewedAt || null,
    createdAt: evidence.createdAt,
    updatedAt: evidence.updatedAt,
  };
}

// For the detail page, which also needs to know which actions this user may take.
export function toEvidenceDetail(evidence, user) {
  const file = evidence.currentFile;
  return {
    ...toEvidenceSummary(evidence),
    description: evidence.description || '',
    uploadedBy: pick(evidence.uploadedBy, ['name', 'email']),
    lastReviewedBy: pick(evidence.lastReviewedBy, ['name']),
    file: file ? { originalName: file.originalName, mimeType: file.mimeType, sizeBytes: file.sizeBytes } : null,
    permissions: permissionsFor(user, evidence),
  };
}

export async function sendEvidence(res, evidence, user, { status = 200, message } = {}) {
  await evidence.populate(EVIDENCE_POPULATE);
  res.status(status).json({ message, evidence: toEvidenceDetail(evidence, user) });
}
