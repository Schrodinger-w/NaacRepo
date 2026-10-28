// The only place the frontend calls fetch(). Pages use apiRequest() so three rules live here
// once rather than in every page:
//   1. requests that change data carry the CSRF token (see backend/src/middleware/csrf.js)
//   2. failures become ApiError, carrying the server's message and any per-field messages
//   3. a 401 tells AuthContext the session has ended

// Vite's dev-server proxy forwards everything under /api to Express.
const API_BASE = '/api';
const CSRF_COOKIE_NAME = 'naac_csrf';
const SAFE_METHODS = ['GET', 'HEAD'];

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.status = status;
    // { email: 'Enter a valid email address.' }, shown next to the matching form field
    this.fieldErrors = fieldErrors;
  }
}

// AuthContext registers here rather than being imported, which would make the two files
// depend on each other.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function readCookie(name) {
  const entry = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : '';
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  let payload;

  if (!SAFE_METHODS.includes(method)) {
    headers['X-CSRF-Token'] = readCookie(CSRF_COOKIE_NAME);
  }
  if (body instanceof FormData) {
    payload = body; // uploads: the browser sets the multipart Content-Type and boundary itself
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(API_BASE + path, { method, headers, body: payload, credentials: 'same-origin' });
  } catch {
    // fetch() throws only when no response arrived at all, e.g. the dev server is stopped.
    throw new ApiError('Cannot reach the server. Check that the app is still running.', 0);
  }

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await response.json() : null;

  if (response.ok) return data;

  // The API always answers in JSON, so a non-JSON error came from the proxy, not from Express.
  if (!isJson) {
    throw new ApiError('The API server is not responding. Start it with "npm run dev" in the backend folder.', response.status);
  }

  if (response.status === 401) onUnauthorized();

  const fieldErrors = {};
  for (const item of data.errors || []) fieldErrors[item.field] = item.message;
  throw new ApiError(data.message || `Request failed with status ${response.status}.`, response.status, fieldErrors);
}
