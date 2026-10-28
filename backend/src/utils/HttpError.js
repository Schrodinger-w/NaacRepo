// An error carrying an HTTP status code, turned into a response by errorHandler.js.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    // Marks the message as written for users and safe to send to the browser.
    this.expose = status < 500;
    // Optional [{ field, message }] that a form shows next to each field.
    this.details = details;
  }
}
