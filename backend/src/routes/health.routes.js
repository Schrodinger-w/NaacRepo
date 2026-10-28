// GET /api/health: is the API up and can it reach the database? No sign-in required, and it
// returns no data of its own.
import { Router } from 'express';
import { isDatabaseConnected } from '../config/db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
    serverTime: new Date().toISOString(),
  });
});

export default router;
