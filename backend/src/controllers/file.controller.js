// GET /api/evidence/:id/file              in-page preview (FR-024)
// GET /api/evidence/:id/file?download=1   download instead
//
// Sign-in, department and view rights have already been checked by the route. Which file to
// send comes from the evidence record, never from the URL, so no path can be requested directly.
import { AUDIT_ACTIONS } from '../config/constants.js';
import { HttpError } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAudit } from '../services/audit.service.js';
import { sendStoredFile } from '../services/fileStorage.js';

export const streamCurrentFile = asyncHandler(async (req, res) => {
  const evidence = req.evidence;
  if (!evidence.currentFile) throw new HttpError(404, 'No file has been attached to this record yet.');

  const download = req.query.download === '1';
  // UC-016 step 10: every file retrieval is audited, viewing as well as downloading.
  await recordAudit(req, download ? AUDIT_ACTIONS.FILE_DOWNLOADED : AUDIT_ACTIONS.FILE_VIEWED, {
    evidence,
    details: { file: evidence.currentFile.originalName, version: evidence.currentVersion || 'draft' },
  });
  await sendStoredFile(res, evidence.currentFile, { download });
});
