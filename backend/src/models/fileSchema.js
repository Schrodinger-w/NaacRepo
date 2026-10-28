// One stored file, shared by Evidence.currentFile and EvidenceVersion.file.
import mongoose from 'mongoose';
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } from '../config/constants.js';

export const fileSchema = new mongoose.Schema(
  {
    // Random name on disk. Users never see or send it; files are fetched by evidence id,
    // so a client-supplied path can never reach the file system.
    storedName: { type: String, required: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, enum: ALLOWED_MIME_TYPES },
    sizeBytes: { type: Number, required: true, min: 1, max: MAX_UPLOAD_BYTES },
  },
  // Part of its parent document, so it needs no _id of its own.
  { _id: false },
);
