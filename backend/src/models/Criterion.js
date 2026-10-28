// One of the 7 NAAC criteria. Loaded by the seed script; the admin can view but not edit them.
import mongoose from 'mongoose';

const criterionSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true, min: 1, max: 7 },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// The third argument names the collection, which Mongoose would otherwise guess as "criterions".
export default mongoose.model('Criterion', criterionSchema, 'criteria');
