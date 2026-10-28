// Runs after a route's express-validator rules and turns any failures into one 400 carrying
// the { field, message } list the React forms show beside each field.
import { body, validationResult } from 'express-validator';
import { HttpError } from '../utils/HttpError.js';

// Shared by "change password" and "create user" so the two cannot drift apart.
export function passwordRule(field) {
  return body(field)
    .isString().withMessage('Enter a password.').bail()
    .isLength({ min: 8, max: 64 }).withMessage('Use between 8 and 64 characters.')
    .matches(/[A-Za-z]/).withMessage('Include at least one letter.')
    .matches(/[0-9]/).withMessage('Include at least one number.')
    // bcrypt silently ignores anything past 72 bytes, and one character can take up to 4.
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72).withMessage('This password is too long.');
}

export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((error) => ({
    field: error.path,
    message: error.msg,
  }));
  next(new HttpError(400, 'Please correct the highlighted fields.', errors));
}
