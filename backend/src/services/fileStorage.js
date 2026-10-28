// All disk access for evidence files, kept together so no other module builds a file path.
import fs from 'node:fs/promises';
import path from 'node:path';
import { EVIDENCE_DIR } from '../config/paths.js';
import { HttpError } from '../utils/HttpError.js';

// basename() strips any folder parts, so even a corrupted storedName such as "../../.env"
// can only ever resolve inside the evidence folder.
export function storedFilePath(storedName) {
  return path.join(EVIDENCE_DIR, path.basename(storedName));
}

// This name only reaches display text and download headers, but control characters are still
// stripped. Trimming from the end keeps the extension.
function cleanOriginalName(name) {
  const cleaned = name.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return (cleaned || 'evidence').slice(-150);
}

// multer's req.file carries more than the schema needs.
export function fileInfoFromUpload(uploadedFile) {
  return {
    storedName: uploadedFile.filename,
    originalName: cleanOriginalName(uploadedFile.originalname),
    mimeType: uploadedFile.verifiedMimeType, // set by middleware/upload.js after checking it
    sizeBytes: uploadedFile.size,
  };
}

// force: a file that is already gone is not an error.
export async function deleteStoredFile(storedName) {
  await fs.rm(storedFilePath(storedName), { force: true });
}

// RFC 6266: filename= carries an ASCII fallback and filename*= the exact UTF-8 name, so a
// non-English file name survives the download.
function contentDisposition(type, fileName) {
  const asciiFallback = fileName.replace(/[^\x20-\x7e]|["\\]/g, '_');
  const encoded = encodeURIComponent(fileName).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${type}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

// sendFile also answers range requests, which PDF viewers use to load a document in pieces.
export function sendStoredFile(res, file, { download = false } = {}) {
  res.set({
    'Content-Type': file.mimeType,
    'Content-Disposition': contentDisposition(download ? 'attachment' : 'inline', file.originalName),
    // Evidence can be sensitive: browsers and proxies must not keep a copy.
    'Cache-Control': 'private, no-store',
    // Replaces Helmet's page policy, whose object-src 'none' would stop the browser's built-in
    // PDF viewer. Dropping the rest is safe because the response is always PDF/PNG/JPEG and
    // nosniff stops the browser treating it as anything else.
    'Content-Security-Policy': "frame-ancestors 'self'",
  });

  return new Promise((resolve, reject) => {
    res.sendFile(storedFilePath(file.storedName), { cacheControl: false, dotfiles: 'deny' }, (err) => {
      if (!err) return resolve();
      // The browser stopped the transfer, e.g. the user navigated away: not a server problem.
      if (err.code === 'ECONNABORTED' || res.headersSent) return resolve();
      if (err.code === 'ENOENT') {
        console.error(`[files] missing on disk: ${file.storedName}`);
        return reject(new HttpError(404, 'The stored file could not be found. Please contact the administrator.'));
      }
      reject(err);
    });
  });
}
