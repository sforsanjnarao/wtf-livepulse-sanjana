import pool from '../db/pool';
import type { ChurnRiskMember, CrossGymRevenue, HourlyStat } from '../types/index';

// ─── Live occupancy ────────────────────────────────────────────────────────
export async function getGymOccupancy(gymId: string): Promise<number> {
  const r = await pool.query(
    `SELECT COUNT(*) as cnt FROM checkins WHERE gym_id = $1 AND checked_out IS NULL`,
    [gymId]
  );
  return parseInt(r.rows[0].cnt, 10);
}

// ─── Today's revenue ───────────────────────────────────────────────────────
export async function getTodayRevenue(gymId: string): Promise<number> {
  const r = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM payments
     WHERE gym_id = $1 AND paid_at >= CURRENT_DATE`,
    [gymId]
  );
  return parseFloat(r.rows[0].total);
}

// ─── All gyms with stats ───────────────────────────────────────────────────
export async function getAllGymsWithStats() {
  const r = await pool.query(`
    SELECT
      g.id, g.name, g.city, g.address, g.capacity, g.status,
      g.opens_at, g.closes_at, g.created_at, g.updated_at,
      COALESCE(occ.live_count, 0)::integer  AS current_occupancy,
      COALESCE(rev.today_total, 0)::numeric AS today_revenue
    FROM gyms g
    LEFT JOIN (
      SELECT gym_id, COUNT(*) AS live_count
      FROM checkins
      WHERE checked_out IS NULL
      GROUP BY gym_id
    ) occ ON occ.gym_id = g.id
    LEFT JOIN (
      SELECT gym_id, SUM(amount) AS today_total
      FROM payments
      WHERE paid_at >= CURRENT_DATE
      GROUP BY gym_id
    ) rev ON rev.gym_id = g.id
    ORDER BY g.name
  `);
  return r.rows;
}

// ─── Churn risk members for a gym ─────────────────────────────────────────
export async function getChurnRiskMembers(gymId: string): Promise<ChurnRiskMember[]> {
  const r = await pool.query(`
    SELECT
      id,
      name,
      last_checkin_at,
      EXTRACT(EPOCH FROM (NOW() - last_checkin_at))::integer / 86400 AS days_absent
    FROM members
    WHERE gym_id = $1
      AND status = 'active'
      AND last_checkin_at < NOW() - INTERVAL '44 days'
    ORDER BY last_checkin_at ASC NULLS FIRST
    LIMIT 200
  `, [gymId]);

  return r.rows.map((row: { id: string; name: string; last_checkin_at: string | null; days_absent: number }) => ({
    id: row.id,
    name: row.name,
    last_checkin_at: row.last_checkin_at,
    days_absent: row.days_absent,
    risk_level: row.days_absent > 60 ? 'CRITICAL' : 'HIGH',
  }));
}

// ─── Peak hours heatmap ────────────────────────────────────────────────────
export async function getPeakHours(gymId: string): Promise<HourlyStat[]> {
  const r = await pool.query(
    `SELECT gym_id, day_of_week, hour_of_day, checkin_count
     FROM gym_hourly_stats
     WHERE gym_id = $1
     ORDER BY day_of_week, hour_of_day`,
    [gymId]
  );
  return r.rows;
}

// ─── Revenue by plan type ──────────────────────────────────────────────────
export async function getRevenueByPlanType(gymId: string, dateRange: string) {
  const intervalMap: Record<string, string> = {
    '7d': '7 days',
    '30d': '30 days',
    '90d': '90 days',
  };
  const interval = intervalMap[dateRange] ?? '30 days';
  const r = await pool.query(`
    SELECT plan_type, COALESCE(SUM(amount), 0)::numeric AS total
    FROM payments
    WHERE gym_id = $1 AND paid_at >= NOW() - $2::interval
    GROUP BY plan_type
    ORDER BY total DESC
  `, [gymId, interval]);
  return r.rows;
}

// ─── New vs renewal ratio ──────────────────────────────────────────────────
export async function getNewVsRenewalRatio(gymId: string, dateRange: string) {
  const intervalMap: Record<string, string> = {
    '7d': '7 days',
    '30d': '30 days',
    '90d': '90 days',
  };
  const interval = intervalMap[dateRange] ?? '30 days';
  const r = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE member_type = 'new')     AS new_count,
      COUNT(*) FILTER (WHERE member_type = 'renewal') AS renewal_count
    FROM members
    WHERE gym_id = $1 AND joined_at >= NOW() - $2::interval
  `, [gymId, interval]);
  return {
    new_count: parseInt(r.rows[0].new_count, 10),
    renewal_count: parseInt(r.rows[0].renewal_count, 10),
  };
}

// ─── Cross-gym revenue ─────────────────────────────────────────────────────
export async function getCrossGymRevenue(): Promise<CrossGymRevenue[]> {
  const r = await pool.query(`
    SELECT
      p.gym_id,
      g.name AS gym_name,
      SUM(p.amount)::numeric AS total_revenue,
      RANK() OVER (ORDER BY SUM(p.amount) DESC) AS rank
    FROM payments p
    JOIN gyms g ON g.id = p.gym_id
    WHERE p.paid_at >= NOW() - INTERVAL '30 days'
    GROUP BY p.gym_id, g.name
    ORDER BY total_revenue DESC
  `);
  return r.rows;
}
