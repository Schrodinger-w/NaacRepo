// /api/auth: who am I, sign in, sign out, change password.
import User, { toPublicUser } from '../models/User.js';
import { AUDIT_ACTIONS } from '../config/constants.js';
import { HttpError } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword, verifyPassword, DUMMY_PASSWORD_HASH } from '../utils/password.js';
import { recordAudit } from '../services/audit.service.js';
import { recordLoginFailure, clearLoginFailures } from '../middleware/loginRateLimit.js';
import { setNewCsrfToken } from '../middleware/csrf.js';
import { SESSION_COOKIE_NAME } from '../middleware/session.js';

// express-session is callback-based; these wrappers let the handlers below use await.
function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}
function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
}

// GET /api/auth/me: who is signed in? Answers { user: null } when nobody is.
export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.json({ user: null });

  const user = await User.findById(userId).populate('department', 'name code').lean();
  if (!user || !user.isActive) return res.json({ user: null });
  res.json({ user: toPublicUser(user) });
});

// POST /api/auth/login  { email, password }  (FR-001, FR-002)
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash').populate('department', 'name code');

  // An unknown email is still compared against a dummy hash, so every failed sign-in costs
  // the same bcrypt work and timing cannot reveal which emails have accounts.
  const passwordMatches = await verifyPassword(password, user ? user.passwordHash : DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches || !user.isActive) {
    recordLoginFailure(req);
    let reason = 'wrong password';
    if (!user) reason = 'unknown email';
    else if (passwordMatches) reason = 'account deactivated';
    await recordAudit(req, AUDIT_ACTIONS.LOGIN_FAILED, { user, email, details: { reason } });
    // FR-002: identical message in all three cases, so the response never reveals whether the
    // account exists. The specific reason goes to the audit log only.
    throw new HttpError(401, 'Invalid email or password.');
  }

  clearLoginFailures(req);
  // Prevents session fixation: a session id planted in the browser before sign-in is discarded
  // rather than becoming an authenticated one.
  await regenerateSession(req);
  req.session.userId = String(user._id);
  setNewCsrfToken(res);

  user.lastLoginAt = new Date();
  await User.updateOne({ _id: user._id }, { lastLoginAt: user.lastLoginAt });
  await recordAudit(req, AUDIT_ACTIONS.LOGIN_SUCCESS, { user });

  res.json({ user: toPublicUser(user) });
});

// POST /api/auth/logout: ends the session on the server and clears the cookie (FR-003).
export const logout = asyncHandler(async (req, res) => {
  const userId = req.session?.userId;
  if (userId) {
    const user = await User.findById(userId).lean();
    await recordAudit(req, AUDIT_ACTIONS.LOGOUT, { user });
    await destroySession(req);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ message: 'You have been signed out.' });
});

// POST /api/auth/change-password  { currentPassword, newPassword }  (FR-004)
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    // 400 rather than 401: the user is signed in, they only mistyped the current password.
    throw new HttpError(400, 'Please correct the highlighted fields.', [
      { field: 'currentPassword', message: 'Your current password is incorrect.' },
    ]);
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  // A fresh session id after a credential change, without signing the user out.
  await regenerateSession(req);
  req.session.userId = String(user._id);

  await recordAudit(req, AUDIT_ACTIONS.PASSWORD_CHANGED);
  res.json({ message: 'Your password has been changed.' });
});
