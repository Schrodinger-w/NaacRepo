// /api/taxonomy: the fixed lists behind every form and filter. Any signed-in user may read them.
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getTaxonomy } from '../controllers/taxonomy.controller.js';

const router = Router();

router.get('/', requireAuth, getTaxonomy);

export default router;
