import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import {
  getAllGymsWithStats,
  getChurnRiskMembers,
  getPeakHours,
  getRevenueByPlanType,
  getNewVsRenewalRatio,
} from '../services/statsService';

const router = Router();

// GET /api/gyms
router.get('/gyms', async (_req: Request, res: Response) => {
  try {
    const gyms = await getAllGymsWithStats();
    res.json(gyms);
  } catch (err) {
    console.error('[GET /api/gyms]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/gyms/:id/live
router.get('/gyms/:id/live', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Gym
    const gymResult = await pool.query('SELECT * FROM gyms WHERE id = $1', [id]);
    if (gymResult.rows.length === 0) {
      res.status(404).json({ error: 'Gym not found' });
      return;
    }
    const gym = gymResult.rows[0];

    // Live occupancy
    const occResult = await pool.query(
      `SELECT COUNT(*) AS cnt FROM checkins WHERE gym_id = $1 AND checked_out IS NULL`,
      [id]
    );
    const currentOccupancy = parseInt(occResult.rows[0].cnt, 10);

    // Today revenue
    const revResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE`,
      [id]
    );
    const todayRevenue = parseFloat(revResult.rows[0].total);

    // Recent events (last 10 checkins with member name)
    const eventsResult = await pool.query(
      `SELECT c.id, c.member_id, c.gym_id, c.checked_in, c.checked_out, c.duration_min,
              m.name AS member_name, g.name AS gym_name
       FROM checkins c
       JOIN members m ON m.id = c.member_id
       JOIN gyms g ON g.id = c.gym_id
       WHERE c.gym_id = $1
       ORDER BY c.checked_in DESC
       LIMIT 10`,
      [id]
    );

    // Active anomalies
    const anomaliesResult = await pool.query(
      `SELECT a.*, g.name AS gym_name FROM anomalies a
       JOIN gyms g ON g.id = a.gym_id
       WHERE a.gym_id = $1 AND a.resolved = FALSE
       ORDER BY a.detected_at DESC`,
      [id]
    );

    res.json({
      gym: {
        ...gym,
        current_occupancy: currentOccupancy,
        today_revenue: todayRevenue,
      },
      occupancy: {
        current: currentOccupancy,
        capacity: gym.capacity,
        percentage: parseFloat(((currentOccupancy / gym.capacity) * 100).toFixed(1)),
      },
      today_revenue: todayRevenue,
      recent_events: eventsResult.rows,
      active_anomalies: anomaliesResult.rows,
    });
  } catch (err) {
    console.error('[GET /api/gyms/:id/live]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/gyms/:id/analytics
router.get('/gyms/:id/analytics', async (req: Request, res: Response) => {
  const { id } = req.params;
  const dateRange = (req.query['dateRange'] as string) || '30d';

  if (!['7d', '30d', '90d'].includes(dateRange)) {
    res.status(400).json({ error: 'Invalid dateRange. Must be 7d, 30d, or 90d.' });
    return;
  }

  try {
    const gymCheck = await pool.query('SELECT id FROM gyms WHERE id = $1', [id]);
    if (gymCheck.rows.length === 0) {
      res.status(404).json({ error: 'Gym not found' });
      return;
    }

    const [peak_hours, revenue_by_plan, churn_risk, new_vs_renewal] = await Promise.all([
      getPeakHours(id),
      getRevenueByPlanType(id, dateRange),
      getChurnRiskMembers(id),
      getNewVsRenewalRatio(id, dateRange),
    ]);

    res.json({ peak_hours, revenue_by_plan, churn_risk, new_vs_renewal });
  } catch (err) {
    console.error('[GET /api/gyms/:id/analytics]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
