// Access control. Protected routes run these in order:
//   requireAuth        is anyone signed in?                        401
//   requireRole(...)   does their role allow this route?           403
//   requireDepartment  does the record belong to their department? 403
//   allow(rule)        may they do THIS action on it right now?    403 or 409
// The React app also hides what a role cannot use, but only these checks protect the data
// (NFR-004 to NFR-006).
import User from '../models/User.js';
import { AUDIT_ACTIONS, DEPARTMENT_SCOPED_ROLES } from '../config/constants.js';
import { HttpError } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAudit } from '../services/audit.service.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const userId = req.session?.userId;
  if (!userId) throw new HttpError(401, 'Please sign in to continue.');

  // Loaded fresh on every request, so a deactivated account or a changed role takes effect
  // immediately rather than at the user's next sign-in.
  const user = await User.findById(userId).populate('department', 'name code').lean();
  if (!user || !user.isActive) {
    req.session.destroy(() => {});
    throw new HttpError(401, 'Please sign in to continue.');
  }

  req.user = user;
  next();
});

export function requireRole(...allowedRoles) {
  return asyncHandler(async (req, res, next) => {
    if (allowedRoles.includes(req.user.role)) return next();

    await recordAudit(req, AUDIT_ACTIONS.ACCESS_DENIED, {
      details: { route: `${req.method} ${req.originalUrl}`, requiredRoles: allowedRoles },
    });
    throw new HttpError(403, 'You do not have permission to do this.');
  });
}

// Faculty and coordinators are limited to their own department; the IQAC lead and admin
// cover the whole institution.
export function canAccessDepartment(user, departmentId) {
  if (!DEPARTMENT_SCOPED_ROLES.includes(user.role)) return true;
  return Boolean(user.department) && String(user.department._id) === String(departmentId);
}

// For routes about one record. `load` fetches it and it is left on req[as] for the controller,
// so the record is read from the database once rather than once per check.
export function requireDepartment({ load, as }) {
  return asyncHandler(async (req, res, next) => {
    const record = await load(req);
    if (!record) throw new HttpError(404, 'The requested record was not found.');

    // May be an id or an already-populated { _id, name, code }.
    const departmentId = record.department?._id ?? record.department;
    if (!canAccessDepartment(req.user, departmentId)) {
      await recordAudit(req, AUDIT_ACTIONS.ACCESS_DENIED, {
        details: { route: `${req.method} ${req.originalUrl}`, reason: 'record belongs to another department' },
      });
      throw new HttpError(403, 'This record belongs to another department.');
    }

    req[as] = record;
    next();
  });
}

// The last check, for one specific action. `rule` returns null when allowed, otherwise
// { status, message }: 403 when this person may never do it (and the refusal is audited),
// 409 when the record's current status forbids it. Runs after requireDepartment loads req.evidence.
export function allow(rule) {
  return asyncHandler(async (req, res, next) => {
    const refusal = rule(req.user, req.evidence);
    if (!refusal) return next();

    if (refusal.status === 403) {
      await recordAudit(req, AUDIT_ACTIONS.ACCESS_DENIED, {
        evidence: req.evidence,
        details: { route: `${req.method} ${req.originalUrl}`, reason: refusal.message },
      });
    }
    throw new HttpError(refusal.status, refusal.message);
  });
}
