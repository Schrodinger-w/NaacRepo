// Slows password guessing on the sign-in route, written by hand rather than pulled in as a
// dependency so the team can explain it.
//
// Counts FAILED sign-ins per (IP address + email). Five failures inside 15 minutes block that
// pair with 429 until the window ends; a success clears the count. Counting only failures means
// normal users are never blocked.
//
// The counts live in memory, so a restart clears them and a multi-server deployment would need
// a shared store such as Redis.
import { AUDIT_ACTIONS } from '../config/constants.js';
import { HttpError } from '../utils/HttpError.js';
import { recordAudit } from '../services/audit.service.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

// key -> { count, firstFailureAt }
const failures = new Map();

function keyFor(req) {
  return `${req.ip}|${String(req.body.email || '').toLowerCase()}`;
}

function activeEntry(key) {
  const entry = failures.get(key);
  if (entry && Date.now() - entry.firstFailureAt >= WINDOW_MS) {
    failures.delete(key); // window over: start counting again from zero
    return undefined;
  }
  return entry;
}

// Runs after the email has been validated but before the sign-in controller.
export async function loginRateLimit(req, res, next) {
  const entry = activeEntry(keyFor(req));
  if (!entry || entry.count < MAX_FAILURES) return next();

  const secondsLeft = Math.ceil((entry.firstFailureAt + WINDOW_MS - Date.now()) / 1000);
  res.set('Retry-After', String(secondsLeft));
  await recordAudit(req, AUDIT_ACTIONS.LOGIN_FAILED, {
    email: req.body.email,
    details: { reason: 'blocked: too many failed attempts' },
  });
  next(new HttpError(429, `Too many failed sign-in attempts. Try again in ${Math.ceil(secondsLeft / 60)} minute(s).`));
}

export function recordLoginFailure(req) {
  const key = keyFor(req);
  const entry = activeEntry(key);
  if (entry) entry.count += 1;
  else failures.set(key, { count: 1, firstFailureAt: Date.now() });
}

export function clearLoginFailures(req) {
  failures.delete(keyFor(req));
}

// Drop finished windows so the map cannot grow without bound. unref() keeps this timer from
// holding the Node process open by itself.
setInterval(() => {
  for (const key of failures.keys()) activeEntry(key);
}, WINDOW_MS).unref();
