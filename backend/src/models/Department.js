// An academic department, such as CSE. Every faculty member and coordinator belongs to one.
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model('Department', departmentSchema);
