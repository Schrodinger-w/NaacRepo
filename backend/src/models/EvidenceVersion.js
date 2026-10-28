// v1.0 at first submission, then v1.1, v1.2 ... each time the file is replaced and
// resubmitted. Append-only, so an old version is never overwritten or lost (BR-006, NFR-012).
import mongoose from 'mongoose';
import { fileSchema } from './fileSchema.js';
import { appendOnly } from './plugins/appendOnly.js';

const { ObjectId } = mongoose.Schema.Types;

const evidenceVersionSchema = new mongoose.Schema(
  {
    evidence: { type: ObjectId, ref: 'Evidence', required: true },
    versionNumber: { type: String, required: true, match: /^1\.\d+$/ },
    file: { type: fileSchema, required: true },
    uploadedBy: { type: ObjectId, ref: 'User', required: true },
  },
  // Never updated, so an updatedAt would always equal createdAt.
  { timestamps: { createdAt: true, updatedAt: false } },
);

// One document per version number per record, which also stops a double-clicked
// "Resubmit" from creating two v1.1 entries.
evidenceVersionSchema.index({ evidence: 1, versionNumber: 1 }, { unique: true });
evidenceVersionSchema.index({ evidence: 1, createdAt: 1 });

appendOnly(evidenceVersionSchema, 'Evidence version');

export default mongoose.model('EvidenceVersion', evidenceVersionSchema);
