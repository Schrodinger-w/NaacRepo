// /api/dashboard. AC-01 of US-008: the dashboard is for the IQAC lead only.
import { Router } from 'express';
import { ROLES } from '../config/constants.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getCriteriaProgress } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/criteria', requireAuth, requireRole(ROLES.IQAC_LEAD), getCriteriaProgress);

export default router;
