// Version history (FR-032, UC-014) and per-version downloads (FR-033, UC-015). The route has
// already established that this user may see the record.
import EvidenceVersion from '../models/EvidenceVersion.js';
import Review from '../models/Review.js';
import { AUDIT_ACTIONS } from '../config/constants.js';
import { HttpError } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAudit } from '../services/audit.service.js';
import { sendStoredFile } from '../services/fileStorage.js';
import { oldVersionsRule } from '../services/evidenceRules.js';

// GET /api/evidence/:id/history: file versions and review decisions, oldest first. They are
// returned as two lists and merged into one timeline by the page.
export const getHistory = asyncHandler(async (req, res) => {
  const evidence = req.evidence;
  const [versions, reviews] = await Promise.all([
    EvidenceVersion.find({ evidence: evidence._id }).populate('uploadedBy', 'name').sort({ createdAt: 1 }).lean(),
    Review.find({ evidence: evidence._id }).populate('reviewer', 'name').sort({ reviewedAt: 1 }).lean(),
  ]);

  res.json({
    versions: versions.map((v) => ({
      _id: v._id,
      versionNumber: v.versionNumber,
      isCurrent: v.versionNumber === evidence.currentVersion,
      uploadedBy: { name: v.uploadedBy?.name },
      createdAt: v.createdAt,
      file: { originalName: v.file.originalName, mimeType: v.file.mimeType, sizeBytes: v.file.sizeBytes },
    })),
    reviews: reviews.map((r) => ({
      _id: r._id,
      decision: r.decision,
      comments: r.comments,
      reviewer: { name: r.reviewer?.name },
      reviewedAt: r.reviewedAt,
    })),
  });
});

// GET /api/evidence/:id/versions/:versionId/file: download one stored version. The current one
// is open to anyone who can see the record; older ones only to the department coordinator and
// the IQAC lead (FR-033).
export const downloadVersionFile = asyncHandler(async (req, res) => {
  const evidence = req.evidence;
  // Matching on both ids stops a version being fetched through a different record.
  const version = await EvidenceVersion.findOne({ _id: req.params.versionId, evidence: evidence._id }).lean();
  if (!version) throw new HttpError(404, 'This version does not exist.');

  if (version.versionNumber !== evidence.currentVersion) {
    const refusal = oldVersionsRule(req.user, evidence);
    if (refusal) {
      await recordAudit(req, AUDIT_ACTIONS.ACCESS_DENIED, {
        evidence,
        details: { route: `${req.method} ${req.originalUrl}`, reason: refusal.message },
      });
      throw new HttpError(refusal.status, refusal.message);
    }
  }

  await recordAudit(req, AUDIT_ACTIONS.FILE_DOWNLOADED, {
    evidence,
    details: { file: version.file.originalName, version: version.versionNumber },
  });
  await sendStoredFile(res, version.file, { download: true });
});
