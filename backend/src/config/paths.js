// Paths are resolved from this file's location so the server behaves the same
// whichever folder it is started from.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFolder = path.dirname(fileURLToPath(import.meta.url));

export const BACKEND_ROOT = path.resolve(thisFolder, '..', '..');

// Outside the frontend and never served as static files: evidence is streamed only
// through API routes that check the user's permission first.
export const EVIDENCE_DIR = path.join(BACKEND_ROOT, 'storage', 'evidence');
