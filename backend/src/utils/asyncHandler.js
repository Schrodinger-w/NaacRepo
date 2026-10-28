// Express 4 ignores a rejected promise from an async handler, leaving the request hanging.
// This forwards the error to next() so errorHandler.js can answer it.
export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
