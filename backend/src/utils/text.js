// Escapes regular-expression metacharacters so text typed by a user (such as "C++") is
// matched literally and cannot be turned into an expensive pattern.
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
