// One audit-log entry (FR-043, NFR-007).
//
// A failed write is logged to the server but never fails the user's action: making the two
// atomic would need MongoDB transactions, which require a replica set rather than the single
// local server this prototype runs on.
import AuditLog from '../models/AuditLog.js';

export async function recordAudit(req, action, { user = req.user, email, evidence, details } = {}) {
  try {
    await AuditLog.create({
      user: user?._id,
      userEmailSnapshot: email ?? user?.email ?? '',
      action,
      evidence: evidence?._id ?? evidence,
      details,
      ipAddress: req.ip || '',
    });
  } catch (err) {
    console.error(`[audit] could not record ${action}:`, err);
  }
}
