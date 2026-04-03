import { Router, Request, Response } from 'express';
import pool from '../db/pool';

const router = Router();

// GET /api/anomalies
router.get('/anomalies', async (req: Request, res: Response) => {
  const gymId = req.query['gym_id'] as string | undefined;
  const severity = req.query['severity'] as string | undefined;

  try {
    const r = await pool.query(
      `SELECT a.*, g.name AS gym_name
       FROM anomalies a
       JOIN gyms g ON g.id = a.gym_id
       WHERE a.resolved = FALSE
         AND ($1::uuid IS NULL OR a.gym_id = $1)
         AND ($2::text IS NULL OR a.severity = $2)
       ORDER BY a.detected_at DESC`,
      [gymId ?? null, severity ?? null]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('[GET /api/anomalies]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/anomalies/:id/dismiss
router.patch('/anomalies/:id/dismiss', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existing = await pool.query('SELECT * FROM anomalies WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Anomaly not found' });
      return;
    }
    const anomaly = existing.rows[0];
    if (anomaly.severity === 'critical') {
      res.status(403).json({ error: 'Critical anomalies cannot be dismissed' });
      return;
    }

    const r = await pool.query(
      `UPDATE anomalies SET dismissed = TRUE WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json(r.rows[0]);
  } catch (err) {
    console.error('[PATCH /api/anomalies/:id/dismiss]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
