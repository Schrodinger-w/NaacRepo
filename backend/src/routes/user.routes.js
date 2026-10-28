// /api/users. Admin only: signed in (else 401), then role ADMIN (else 403).
import { Router } from 'express';
import { body } from 'express-validator';
import { ROLES, ROLE_LIST } from '../config/constants.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, passwordRule } from '../middleware/validate.js';
import { listUsers, createUser } from '../controllers/user.controller.js';

const router = Router();

const newUserRules = [
  body('name')
    .isString().withMessage('Enter a name.').bail()
    .trim().notEmpty().withMessage('Enter a name.')
    .isLength({ max: 100 }).withMessage('Keep the name under 100 characters.'),
  body('email')
    .isString().withMessage('Enter a valid email address.').bail()
    .trim().toLowerCase()
    .isEmail().withMessage('Enter a valid email address.'),
  body('role').isIn(ROLE_LIST).withMessage('Choose a role.'),
  body('department').optional({ values: 'falsy' }).isMongoId().withMessage('Choose a department.'),
  body('phone')
    .optional().isString().bail().trim()
    .isLength({ max: 20 }).withMessage('Keep the phone number under 20 characters.')
    .matches(/^[0-9+\-\s()]*$/).withMessage('Use only digits, spaces, +, - and brackets.'),
  passwordRule('password'),
];

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/', listUsers);
router.post('/', newUserRules, validate, createUser);

export default router;
