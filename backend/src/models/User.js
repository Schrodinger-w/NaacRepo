// A person who can sign in. The password exists only as a bcrypt hash.
import mongoose from 'mongoose';
import { ROLE_LIST, DEPARTMENT_SCOPED_ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Enter a name.'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Enter an email address.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false keeps the hash out of every query unless .select('+passwordHash') asks for it.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLE_LIST },
    // Required for faculty and coordinators only; the IQAC lead and admin are institution-wide.
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [
        function departmentNeeded() {
          return DEPARTMENT_SCOPED_ROLES.includes(this.role);
        },
        'Choose a department for this role.',
      ],
    },
    phone: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    // Second safety net: a hash loaded by mistake is still stripped on the way out.
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

// The only shape of a user the API sends to the browser. Expects `department` populated.
export function toPublicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department
      ? { _id: user.department._id, code: user.department.code, name: user.department.name }
      : null,
    phone: user.phone || '',
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt || null,
  };
}

export default mongoose.model('User', userSchema);
