// The last two middleware in the chain. Every error becomes a response here, and only here:
// the browser gets a short safe message, the full error goes to the server terminal.

export function notFound(req, res) {
  res.status(404).json({ message: 'The requested resource was not found.' });
}

// Mongoose validation messages come from our own schemas, so they are safe to show, and are
// reshaped into the { field, message } list the React forms already understand.
function fieldErrorsFrom(mongooseError) {
  return Object.values(mongooseError.errors).map((error) => ({
    field: error.path,
    message: error.name === 'CastError' ? 'This value is not valid.' : error.message,
  }));
}

// Express identifies an error handler by its four parameters, so `next` must stay in the
// signature even though only the headersSent branch uses it.
export function errorHandler(err, req, res, next) {
  // The response has already started (streaming a file), so JSON can no longer be sent.
  if (res.headersSent) return next(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Please correct the highlighted fields.', errors: fieldErrorsFrom(err) });
  }
  // An id in the URL that is not a valid ObjectId.
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'The request contains an invalid identifier.' });
  }
  // Optimistic concurrency: someone else changed the record between our read and our save.
  if (err.name === 'VersionError') {
    return res.status(409).json({ message: 'This record was changed by someone else at the same time. Reload the page and try again.' });
  }
  // Unique index violated, e.g. an email that is already registered.
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with the same unique value already exists.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request body is not valid JSON.' });
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  // Only messages we wrote for users are forwarded; anything else is replaced below.
  const messageIsSafe = status < 500 && err.expose === true;

  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} failed:`);
    console.error(err);
  }

  const body = {
    message: messageIsSafe
      ? err.message
      : status >= 500
        ? 'Something went wrong on the server. Please try again.'
        : 'The request could not be processed.',
  };
  if (messageIsSafe && err.details) body.errors = err.details;

  res.status(status).json(body);
}
