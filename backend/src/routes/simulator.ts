import { Router, Request, Response } from 'express';
import { startSimulator, stopSimulator, resetSimulator, getSimulatorStatus } from '../services/simulatorService';

const router = Router();

// POST /api/simulator/start
router.post('/simulator/start', async (req: Request, res: Response) => {
  const { speed } = req.body as { speed?: unknown };
  if (speed !== 1 && speed !== 5 && speed !== 10) {
    res.status(400).json({ error: 'Invalid speed. Must be 1, 5, or 10.' });
    return;
  }
  startSimulator(speed as 1 | 5 | 10);
  res.json({ status: 'running', speed });
});

// POST /api/simulator/stop
router.post('/simulator/stop', (_req: Request, res: Response) => {
  stopSimulator();
  res.json({ status: 'paused' });
});

// POST /api/simulator/reset
router.post('/simulator/reset', async (_req: Request, res: Response) => {
  try {
    await resetSimulator();
    res.json({ status: 'reset' });
  } catch (err) {
    console.error('[POST /api/simulator/reset]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/simulator/status
router.get('/simulator/status', (_req: Request, res: Response) => {
  res.json(getSimulatorStatus());
});

export default router;
