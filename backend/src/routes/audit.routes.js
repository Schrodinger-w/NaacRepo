// /api/audit-logs. Admin only. Reading the log is deliberately not itself logged.
import { Router } from 'express';
import { query } from 'express-validator';
import { AUDIT_ACTION_LIST, ROLES } from '../config/constants.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listAuditLogs } from '../controllers/audit.controller.js';

const router = Router();

const filterRules = [
  query('action').optional({ values: 'falsy' }).isIn(AUDIT_ACTION_LIST).withMessage('Choose a valid action.'),
  query('email').optional().isString().withMessage('Enter the email as text.').bail()
    .isLength({ max: 100 }).withMessage('Keep the email under 100 characters.'),
  query('from').optional({ values: 'falsy' }).isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('Enter a valid start date.'),
  query('to').optional({ values: 'falsy' }).isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('Enter a valid end date.'),
  query('page').optional().isInt({ min: 1, max: 100000 }).withMessage('Invalid page number.').toInt(),
];

router.get('/', requireAuth, requireRole(ROLES.ADMIN), filterRules, validate, listAuditLogs);

export default router;
