import pool from '../db/pool';
import { broadcast } from '../websocket/server';
import type {
  CheckinEvent, CheckoutEvent, PaymentEvent,
} from '../types/index';

interface SimulatorState {
  running: boolean;
  speed: 1 | 5 | 10;
  intervalId: NodeJS.Timeout | null;
}

const state: SimulatorState = {
  running: false,
  speed: 1,
  intervalId: null,
};

export function getSimulatorStatus(): { running: boolean; speed: number } {
  return { running: state.running, speed: state.speed };
}

async function getRandomActiveGymAndMember(): Promise<{
  gymId: string; gymName: string; gymCapacity: number;
  memberId: string; memberName: string;
} | null> {
  const r = await pool.query(`
    SELECT m.id AS member_id, m.name AS member_name,
           g.id AS gym_id, g.name AS gym_name, g.capacity
    FROM members m
    JOIN gyms g ON g.id = m.gym_id
    WHERE m.status = 'active'
    ORDER BY RANDOM()
    LIMIT 1
  `);
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    gymId: row.gym_id,
    gymName: row.gym_name,
    gymCapacity: parseInt(row.capacity, 10),
    memberId: row.member_id,
    memberName: row.member_name,
  };
}

async function simulateTick(): Promise<void> {
  try {
    const actor = await getRandomActiveGymAndMember();
    if (!actor) return;

    const { gymId, gymName, gymCapacity, memberId, memberName } = actor;

    // Current occupancy
    const occR = await pool.query(
      `SELECT COUNT(*) AS cnt FROM checkins WHERE gym_id = $1 AND checked_out IS NULL`,
      [gymId]
    );
    const currentOccupancy = parseInt(occR.rows[0].cnt, 10);

    // Check if this member is currently checked in
    const openR = await pool.query(
      `SELECT id FROM checkins WHERE member_id = $1 AND checked_out IS NULL LIMIT 1`,
      [memberId]
    );
    const isCheckedIn = openR.rows.length > 0;

    const roll = Math.random();

    if (!isCheckedIn && roll < 0.60) {
      // Check-in
      await pool.query(
        `INSERT INTO checkins (member_id, gym_id) VALUES ($1, $2)`,
        [memberId, gymId]
      );
      await pool.query(
        `UPDATE members SET last_checkin_at = NOW() WHERE id = $1`,
        [memberId]
      );
      const newOcc = currentOccupancy + 1;
      const evt: CheckinEvent = {
        type: 'CHECKIN_EVENT',
        gym_id: gymId,
        member_name: memberName,
        timestamp: new Date().toISOString(),
        current_occupancy: newOcc,
        capacity_pct: parseFloat(((newOcc / gymCapacity) * 100).toFixed(1)),
      };
      broadcast(evt);
    } else if (isCheckedIn && roll >= 0.60) {
      // Check-out
      await pool.query(
        `UPDATE checkins SET checked_out = NOW() WHERE member_id = $1 AND checked_out IS NULL`,
        [memberId]
      );
      const newOcc = Math.max(0, currentOccupancy - 1);
      const evt: CheckoutEvent = {
        type: 'CHECKOUT_EVENT',
        gym_id: gymId,
        member_name: memberName,
        timestamp: new Date().toISOString(),
        current_occupancy: newOcc,
        capacity_pct: parseFloat(((newOcc / gymCapacity) * 100).toFixed(1)),
      };
      broadcast(evt);
    }

    // 5% chance of payment event
    if (Math.random() < 0.05) {
      const planTypes = ['monthly', 'quarterly', 'annual'];
      const amounts: Record<string, number> = { monthly: 1499, quarterly: 3999, annual: 11999 };
      const planType = planTypes[Math.floor(Math.random() * planTypes.length)];
      const amount = amounts[planType];

      await pool.query(
        `INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type)
         VALUES ($1, $2, $3, $4, 'new')`,
        [memberId, gymId, amount, planType]
      );

      const todayR = await pool.query(
        `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE`,
        [gymId]
      );
      const todayTotal = parseFloat(todayR.rows[0].total);

      const evt: PaymentEvent = {
        type: 'PAYMENT_EVENT',
        gym_id: gymId,
        amount,
        plan_type: planType,
        member_name: memberName,
        today_total: todayTotal,
      };
      broadcast(evt);
    }
  } catch (err) {
    console.error('[Simulator] Tick error:', err);
  }
}

export function startSimulator(speed: 1 | 5 | 10): void {
  if (state.running) stopSimulator();
  state.speed = speed;
  state.running = true;
  const intervalMs = Math.round(2000 / speed);
  state.intervalId = setInterval(simulateTick, intervalMs);
  console.log(`[Simulator] Started at speed ${speed}x (interval: ${intervalMs}ms)`);
}

export function stopSimulator(): void {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
  state.running = false;
  console.log('[Simulator] Stopped');
}

export async function resetSimulator(): Promise<void> {
  stopSimulator();
  // Close all open check-ins
  await pool.query(`UPDATE checkins SET checked_out = NOW() WHERE checked_out IS NULL`);
  console.log('[Simulator] Reset — all open check-ins closed');
}
