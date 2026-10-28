// CSRF protection by the double-submit cookie pattern, written by hand rather than pulled
// in as a dependency so the team can explain it.
//
// The server puts a random token in a cookie that JavaScript can read; the React client
// copies it into the X-CSRF-Token header on every request that changes data; the server
// requires the two to match. Another site can make the browser SEND our cookies with a
// forged request but cannot READ them, so it cannot produce the header.
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

export const CSRF_COOKIE_NAME = 'naac_csrf';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// Read one cookie from the raw header; the cookie-parser package is not a dependency.
function readCookie(req, name) {
  for (const pair of (req.headers.cookie || '').split(';')) {
    const [key, ...rest] = pair.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return '';
}

// Also called right after sign-in, so a token planted before sign-in is useless afterwards.
export function setNewCsrfToken(res) {
  res.cookie(CSRF_COOKIE_NAME, crypto.randomBytes(32).toString('hex'), {
    httpOnly: false, // deliberate: the React client has to read this one
    sameSite: 'strict',
    secure: env.NODE_ENV === 'production',
    path: '/',
  });
}

export function csrfProtection(req, res, next) {
  const cookieToken = readCookie(req, CSRF_COOKIE_NAME);

  if (SAFE_METHODS.includes(req.method)) {
    // Reading cannot be abused this way; just make sure a token is ready for later.
    if (!cookieToken) setNewCsrfToken(res);
    return next();
  }

  const fromCookie = Buffer.from(cookieToken);
  const fromHeader = Buffer.from(req.get('X-CSRF-Token') || '');
  // Constant-time comparison, so response timing reveals nothing about the token.
  const tokensMatch =
    fromCookie.length > 0 && fromCookie.length === fromHeader.length && crypto.timingSafeEqual(fromCookie, fromHeader);

  if (!tokensMatch) {
    return next(new HttpError(403, 'Security check failed. Refresh the page and try again.'));
  }
  next();
}
