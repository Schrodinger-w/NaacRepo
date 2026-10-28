// /api/users, admin only: list accounts and create new ones (FR-042, UC-019).
import User, { toPublicUser } from '../models/User.js';
import Department from '../models/Department.js';
import { AUDIT_ACTIONS, DEPARTMENT_SCOPED_ROLES } from '../config/constants.js';
import { HttpError } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword } from '../utils/password.js';
import { recordAudit } from '../services/audit.service.js';

// GET /api/users: every account, without password hashes.
export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate('department', 'name code').sort({ role: 1, name: 1 }).lean();
  res.json({ users: users.map(toPublicUser) });
});

// POST /api/users  { name, email, role, department?, phone?, password }
// The admin sets an initial password and passes it on directly; the prototype sends no email.
// The new user changes it under "My profile".
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, role, department, phone, password } = req.body;

  if (await User.exists({ email })) {
    throw new HttpError(409, 'Please correct the highlighted fields.', [
      { field: 'email', message: 'An account with this email already exists.' },
    ]);
  }

  // A department sent for an institution-wide role is ignored rather than rejected.
  const needsDepartment = DEPARTMENT_SCOPED_ROLES.includes(role);
  if (needsDepartment && !(department && (await Department.exists({ _id: department, isActive: true })))) {
    throw new HttpError(400, 'Please correct the highlighted fields.', [
      { field: 'department', message: 'Choose a department for this role.' },
    ]);
  }

  const user = await User.create({
    name,
    email,
    role,
    phone: phone || '',
    department: needsDepartment ? department : undefined,
    passwordHash: await hashPassword(password),
  });
  await user.populate('department', 'name code');

  await recordAudit(req, AUDIT_ACTIONS.USER_CREATED, {
    details: { createdEmail: user.email, role: user.role, department: user.department?.code || '' },
  });
  res.status(201).json({ message: `Account created for ${user.name}.`, user: toPublicUser(user) });
});
