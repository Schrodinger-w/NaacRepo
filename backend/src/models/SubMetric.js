// A metric under a criterion, e.g. 1.1.2 under criterion 1. FR-015: each evidence record is
// tagged with exactly one.
import mongoose from 'mongoose';

const subMetricSchema = new mongoose.Schema(
  {
    // The code always starts with its criterion's number.
    code: { type: String, required: true, unique: true, trim: true, match: /^[1-7]\.\d+\.\d+$/ },
    criterion: { type: mongoose.Schema.Types.ObjectId, ref: 'Criterion', required: true },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// The upload form loads "all sub-metrics of criterion X" on every criterion change.
subMetricSchema.index({ criterion: 1, code: 1 });

export default mongoose.model('SubMetric', subMetricSchema);
