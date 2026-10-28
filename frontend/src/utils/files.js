// A copy of the server's upload rules (backend/src/config/constants.js), checked here only to
// give instant feedback. The server checks again, including the file's actual bytes, which the
// browser cannot see.

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

// For <input type="file" accept="...">: the file picker shows only these types.
export const FILE_INPUT_ACCEPT = '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg';

// Returns an error message, or '' when the file passes.
export function checkEvidenceFile(file) {
  const dot = file.name.lastIndexOf('.');
  const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  if (!ALLOWED_TYPES[extension] || file.type !== ALLOWED_TYPES[extension]) {
    return 'Only PDF, PNG or JPG files are allowed.';
  }
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_FILE_BYTES) return 'The file is larger than 10 MB.';
  return '';
}
