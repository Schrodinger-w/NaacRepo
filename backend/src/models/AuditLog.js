// FR-043, NFR-007, NFR-019: who did what, to which record, when and from which IP address.
// Append-only, so entries cannot be edited or erased through the app.
import mongoose from 'mongoose';
import { AUDIT_ACTION_LIST } from '../config/constants.js';
import { appendOnly } from './plugins/appendOnly.js';

const { ObjectId } = mongoose.Schema.Types;

const auditLogSchema = new mongoose.Schema(
  {
    // Empty when a sign-in failed against an email that has no account.
    user: { type: ObjectId, ref: 'User' },
    // Copied at the time of the action, so the entry still reads correctly if the user changes.
    userEmailSnapshot: { type: String, default: '' },
    action: { type: String, required: true, enum: AUDIT_ACTION_LIST },
    evidence: { type: ObjectId, ref: 'Evidence' },
    // Extra facts about the action, e.g. { reason: 'wrong password' }.
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The audit-log viewer lists newest first and filters by action, user or record.
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ evidence: 1, createdAt: -1 });

appendOnly(auditLogSchema, 'Audit log');

export default mongoose.model('AuditLog', auditLogSchema);
