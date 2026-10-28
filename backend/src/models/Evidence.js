// One piece of evidence and its current state. Earlier files live in EvidenceVersion;
// this document always points at the current one.
import mongoose from 'mongoose';
import { ACADEMIC_YEARS, EVIDENCE_STATUS, EVIDENCE_STATUS_LIST } from '../config/constants.js';
import { fileSchema } from './fileSchema.js';
import SubMetric from './SubMetric.js';

const { ObjectId } = mongoose.Schema.Types;

// A DRAFT needs only a title; everything else becomes required as it leaves DRAFT.
function requiredOnceSubmitted() {
  return this.status !== EVIDENCE_STATUS.DRAFT;
}

const evidenceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Enter a title.'],
      trim: true,
      maxlength: [200, 'Keep the title under 200 characters.'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Keep the description under 2000 characters.'],
    },
    criterion: { type: ObjectId, ref: 'Criterion', required: [requiredOnceSubmitted, 'Choose a NAAC criterion.'] },
    subMetric: { type: ObjectId, ref: 'SubMetric', required: [requiredOnceSubmitted, 'Choose a sub-metric.'] },
    academicYear: {
      type: String,
      enum: { values: ACADEMIC_YEARS, message: 'Choose a valid academic year.' },
      required: [requiredOnceSubmitted, 'Choose an academic year.'],
    },
    // FR-017, AC-08: copied from the uploader's account, never taken from the request.
    department: { type: ObjectId, ref: 'Department', required: true },
    uploadedBy: { type: ObjectId, ref: 'User', required: true },
    status: { type: String, required: true, enum: EVIDENCE_STATUS_LIST, default: EVIDENCE_STATUS.DRAFT },
    // "1.0", "1.1", ...; empty until the first submission.
    currentVersion: { type: String, default: '' },
    currentFile: { type: fileSchema, required: [requiredOnceSubmitted, 'Attach the evidence file.'] },
    // FR-025, BR-004: true while APPROVED, which blocks faculty edits and deletion.
    isLocked: { type: Boolean, default: false },
    // AC-06 of US-006: the most recent reviewer comment, shown to the faculty member.
    lastFeedback: { type: String, default: '' },
    lastReviewedBy: { type: ObjectId, ref: 'User' },
    lastReviewedAt: { type: Date },
  },
  {
    timestamps: true,
    // Two coordinators reviewing the same record at once: the second save fails with a
    // VersionError instead of silently overwriting the first decision.
    optimisticConcurrency: true,
  },
);

// AC-06: enforced in the model rather than a route, so no caller can save a mismatched pair.
evidenceSchema.pre('validate', async function checkSubMetricMatchesCriterion() {
  if (!this.subMetric) return;
  if (!this.criterion) {
    this.invalidate('criterion', 'Choose the criterion before the sub-metric.');
    return;
  }
  const subMetric = await SubMetric.findById(this.subMetric).select('criterion').lean();
  if (!subMetric || String(subMetric.criterion) !== String(this.criterion)) {
    this.invalidate('subMetric', 'This sub-metric does not belong to the chosen criterion.');
  }
});

// Covering the review queue, "My evidence" and the dashboard's per-criterion counts.
evidenceSchema.index({ department: 1, status: 1, updatedAt: -1 });
evidenceSchema.index({ uploadedBy: 1, updatedAt: -1 });
evidenceSchema.index({ criterion: 1, status: 1 });

export default mongoose.model('Evidence', evidenceSchema);
