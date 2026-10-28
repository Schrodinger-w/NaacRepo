// Dates in Indian English, e.g. "22 Oct 2026, 4:56 pm". A dash when there is no date.
export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

// 1536 -> "1.5 KB", 2400000 -> "2.3 MB".
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
