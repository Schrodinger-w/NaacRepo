// /api/auth. Each route lists, in order, the checks that run before its controller.
import { Router } from 'express';
import { body } from 'express-validator';
import { validate, passwordRule } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { loginRateLimit } from '../middleware/loginRateLimit.js';
import { getCurrentUser, login, logout, changePassword } from '../controllers/auth.controller.js';

const router = Router();

router.get('/me', getCurrentUser);

router.post(
  '/login',
  // isString() first, so an object such as {"$gt": ""} is rejected before it reaches a query.
  body('email')
    .isString().withMessage('Enter a valid email address.').bail()
    .trim().toLowerCase()
    .isEmail().withMessage('Enter a valid email address.'),
  body('password').isString().withMessage('Enter your password.').bail().notEmpty().withMessage('Enter your password.'),
  validate,
  loginRateLimit,
  login,
);

router.post('/logout', logout);

router.post(
  '/change-password',
  requireAuth,
  body('currentPassword')
    .isString().withMessage('Enter your current password.').bail()
    .notEmpty().withMessage('Enter your current password.'),
  // The shared password rules, plus: it must differ from the current one.
  passwordRule('newPassword')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('Choose a password different from your current one.'),
  validate,
  changePassword,
);

export default router;
