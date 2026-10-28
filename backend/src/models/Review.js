// One review decision: approved or sent back by the coordinator, or flagged for re-audit by
// the IQAC lead. Together these form the review trail (UC-011), so they are append-only.
import mongoose from 'mongoose';
import { REVIEW_DECISIONS, REVIEW_DECISION_LIST } from '../config/constants.js';
import { appendOnly } from './plugins/appendOnly.js';

const { ObjectId } = mongoose.Schema.Types;

const reviewSchema = new mongoose.Schema({
  evidence: { type: ObjectId, ref: 'Evidence', required: true },
  reviewer: { type: ObjectId, ref: 'User', required: true },
  decision: { type: String, required: true, enum: REVIEW_DECISION_LIST },
  // FR-027 / BR-005: every decision other than an approval must explain what is wrong.
  comments: {
    type: String,
    trim: true,
    default: '',
    maxlength: [2000, 'Keep the feedback under 2000 characters.'],
    required: [
      function feedbackNeeded() {
        return this.decision !== REVIEW_DECISIONS.APPROVED;
      },
      'Enter feedback explaining what needs to change.',
    ],
  },
  reviewedAt: { type: Date, default: Date.now },
});

reviewSchema.index({ evidence: 1, reviewedAt: 1 });

appendOnly(reviewSchema, 'Review');

export default mongoose.model('Review', reviewSchema);
