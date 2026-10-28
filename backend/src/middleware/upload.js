// Receives the uploaded evidence file (form field "file") and checks it three ways before any
// controller sees it (FR-009 to FR-011, BR-003, AC-02):
//   1. extension           .pdf .png .jpg .jpeg only
//   2. declared MIME type  must match the extension
//   3. first bytes         must match that type's signature, so a renamed .docx fails here
// Size is enforced while the file streams in, so an oversized file is never fully stored (AC-03).
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { EVIDENCE_DIR } from '../config/paths.js';
import { ALLOWED_FILE_TYPES, MAX_UPLOAD_BYTES } from '../config/constants.js';
import { HttpError } from '../utils/HttpError.js';

// How a genuine file of each type begins.
const FILE_SIGNATURES = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d], // "%PDF-"
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff],
};

// A 400 error attached to the form's "file" field.
function fileError(message) {
  return new HttpError(400, 'Please correct the highlighted fields.', [{ field: 'file', message }]);
}

const storage = multer.diskStorage({
  destination: EVIDENCE_DIR,
  // A random name: users cannot choose, guess or overwrite where a file is stored.
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
});

// Checks 1 and 2 run before anything is written to disk.
function checkTypeBeforeSaving(req, file, cb) {
  const expectedMimeType = ALLOWED_FILE_TYPES[path.extname(file.originalname).toLowerCase()];
  if (!expectedMimeType || file.mimetype !== expectedMimeType) {
    return cb(fileError('Only PDF, PNG or JPG files are allowed.'));
  }
  file.verifiedMimeType = expectedMimeType;
  cb(null, true);
}

const acceptSingleFile = multer({
  storage,
  fileFilter: checkTypeBeforeSaving,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 20, fieldSize: 16 * 1024 },
  // multer defaults to latin1; without this a name like "रिपोर्ट.pdf" arrives garbled.
  defParamCharset: 'utf8',
}).single('file');

// Check 3: compare the first bytes on disk with the signature expected for that type.
async function hasExpectedSignature(filePath, mimeType) {
  const signature = FILE_SIGNATURES[mimeType];
  const handle = await fs.open(filePath, 'r');
  try {
    const { bytesRead, buffer } = await handle.read(Buffer.alloc(signature.length), 0, signature.length, 0);
    return bytesRead === signature.length && signature.every((byte, i) => buffer[i] === byte);
  } finally {
    await handle.close();
  }
}

// A file is optional here, because a draft may have none; the controllers decide when one
// is required.
export function receiveEvidenceFile(req, res, next) {
  acceptSingleFile(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        throw fileError(err.code === 'LIMIT_FILE_SIZE' ? 'The file is larger than 10 MB.' : 'Attach exactly one file.');
      }
      if (err) throw err;
      if (req.file && !(await hasExpectedSignature(req.file.path, req.file.verifiedMimeType))) {
        throw fileError('This file is not a genuine PDF, PNG or JPG. Please check the file and try again.');
      }
      next();
    } catch (error) {
      next(error); // discardUploadOnError, at the end of the route list, deletes the stored file
    }
  });
}

// Last middleware on every upload route: if the request failed after multer stored the file,
// delete it so a rejected upload never leaves an orphan behind.
export async function discardUploadOnError(err, req, res, next) {
  if (req.file) await fs.rm(req.file.path, { force: true }).catch(() => {});
  next(err);
}
