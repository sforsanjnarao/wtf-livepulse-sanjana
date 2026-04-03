import { Router, Request, Response } from 'express';
import { getCrossGymRevenue } from '../services/statsService';

const router = Router();

// GET /api/analytics/cross-gym
router.get('/analytics/cross-gym', async (_req: Request, res: Response) => {
  try {
    const data = await getCrossGymRevenue();
    res.json(data);
  } catch (err) {
    console.error('[GET /api/analytics/cross-gym]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
