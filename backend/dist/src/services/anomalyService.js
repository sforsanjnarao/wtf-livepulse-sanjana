"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectZeroCheckins = detectZeroCheckins;
exports.detectCapacityBreach = detectCapacityBreach;
exports.detectRevenueDrop = detectRevenueDrop;
exports.resolveAnomalies = resolveAnomalies;
const pool_1 = __importDefault(require("../db/pool"));
const server_1 = require("../websocket/server");
// ─── Detect: zero check-ins ────────────────────────────────────────────────
async function detectZeroCheckins() {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM
    // Find active gyms within operating hours that have no check-ins in last 2 hours
    const r = await pool_1.default.query(`
    SELECT g.id, g.name, g.opens_at::text, g.closes_at::text,
           MAX(c.checked_in) AS last_checkin
    FROM gyms g
    LEFT JOIN checkins c ON c.gym_id = g.id AND c.checked_in >= NOW() - INTERVAL '2 hours'
    WHERE g.status = 'active'
      AND $1::time >= g.opens_at
      AND $1::time <= g.closes_at
    GROUP BY g.id, g.name, g.opens_at, g.closes_at
    HAVING MAX(c.checked_in) IS NULL
  `, [currentTime]);
    for (const gym of r.rows) {
        // Check if anomaly already exists unresolved
        const existing = await pool_1.default.query(`SELECT id FROM anomalies WHERE gym_id = $1 AND type = 'zero_checkins' AND resolved = FALSE LIMIT 1`, [gym.id]);
        if (existing.rows.length > 0)
            continue;
        const msg = `${gym.name} has had zero check-ins for 2+ hours during operating hours.`;
        const ins = await pool_1.default.query(`INSERT INTO anomalies (gym_id, type, severity, message)
       VALUES ($1, 'zero_checkins', 'warning', $2) RETURNING *`, [gym.id, msg]);
        const anomaly = ins.rows[0];
        const evt = {
            type: 'ANOMALY_DETECTED',
            anomaly_id: anomaly.id,
            gym_id: gym.id,
            gym_name: gym.name,
            anomaly_type: 'zero_checkins',
            severity: 'warning',
            message: msg,
        };
        (0, server_1.broadcast)(evt);
        console.log(`[Anomaly] zero_checkins detected at ${gym.name}`);
    }
}
// ─── Detect: capacity breach ───────────────────────────────────────────────
async function detectCapacityBreach() {
    const r = await pool_1.default.query(`
    SELECT g.id, g.name, g.capacity, COUNT(c.id) AS occupancy
    FROM gyms g
    JOIN checkins c ON c.gym_id = g.id AND c.checked_out IS NULL
    WHERE g.status = 'active'
    GROUP BY g.id, g.name, g.capacity
    HAVING COUNT(c.id) > g.capacity * 0.9
  `);
    for (const gym of r.rows) {
        const existing = await pool_1.default.query(`SELECT id FROM anomalies WHERE gym_id = $1 AND type = 'capacity_breach' AND resolved = FALSE LIMIT 1`, [gym.id]);
        if (existing.rows.length > 0)
            continue;
        const pct = ((gym.occupancy / gym.capacity) * 100).toFixed(1);
        const msg = `${gym.name} is at ${pct}% capacity (${gym.occupancy}/${gym.capacity} members).`;
        const ins = await pool_1.default.query(`INSERT INTO anomalies (gym_id, type, severity, message)
       VALUES ($1, 'capacity_breach', 'critical', $2) RETURNING *`, [gym.id, msg]);
        const anomaly = ins.rows[0];
        const evt = {
            type: 'ANOMALY_DETECTED',
            anomaly_id: anomaly.id,
            gym_id: gym.id,
            gym_name: gym.name,
            anomaly_type: 'capacity_breach',
            severity: 'critical',
            message: msg,
        };
        (0, server_1.broadcast)(evt);
        console.log(`[Anomaly] capacity_breach detected at ${gym.name} (${gym.occupancy}/${gym.capacity})`);
    }
}
// ─── Detect: revenue drop ──────────────────────────────────────────────────
async function detectRevenueDrop() {
    const r = await pool_1.default.query(`
    WITH today_rev AS (
      SELECT gym_id, COALESCE(SUM(amount), 0) AS revenue
      FROM payments WHERE paid_at >= CURRENT_DATE
      GROUP BY gym_id
    ),
    last_week_rev AS (
      SELECT gym_id, COALESCE(SUM(amount), 0) AS revenue
      FROM payments
      WHERE paid_at >= CURRENT_DATE - INTERVAL '7 days'
        AND paid_at < CURRENT_DATE - INTERVAL '6 days'
      GROUP BY gym_id
    )
    SELECT lw.gym_id, g.name, lw.revenue AS last_week, COALESCE(tr.revenue, 0) AS today
    FROM last_week_rev lw
    JOIN gyms g ON g.id = lw.gym_id
    LEFT JOIN today_rev tr ON tr.gym_id = lw.gym_id
    WHERE COALESCE(tr.revenue, 0) < lw.revenue * 0.7
      AND lw.revenue > 0
  `);
    for (const gym of r.rows) {
        const existing = await pool_1.default.query(`SELECT id FROM anomalies WHERE gym_id = $1 AND type = 'revenue_drop' AND resolved = FALSE LIMIT 1`, [gym.id]);
        if (existing.rows.length > 0)
            continue;
        const dropPct = (100 - (gym.today / gym.last_week) * 100).toFixed(0);
        const msg = `${gym.name} revenue is down ${dropPct}% vs same day last week (₹${Math.round(gym.today)} vs ₹${Math.round(gym.last_week)}).`;
        const ins = await pool_1.default.query(`INSERT INTO anomalies (gym_id, type, severity, message)
       VALUES ($1, 'revenue_drop', 'warning', $2) RETURNING *`, [gym.id, msg]);
        const anomaly = ins.rows[0];
        const evt = {
            type: 'ANOMALY_DETECTED',
            anomaly_id: anomaly.id,
            gym_id: gym.id,
            gym_name: gym.name,
            anomaly_type: 'revenue_drop',
            severity: 'warning',
            message: msg,
        };
        (0, server_1.broadcast)(evt);
        console.log(`[Anomaly] revenue_drop detected at ${gym.name}`);
    }
}
// ─── Auto-resolve existing anomalies ──────────────────────────────────────
async function resolveAnomalies() {
    // Resolve zero_checkins when check-ins resume
    const zeroCheckinAnomalies = await pool_1.default.query(`SELECT id, gym_id FROM anomalies WHERE type = 'zero_checkins' AND resolved = FALSE`);
    for (const a of zeroCheckinAnomalies.rows) {
        const recent = await pool_1.default.query(`SELECT id FROM checkins WHERE gym_id = $1 AND checked_in >= NOW() - INTERVAL '2 hours' LIMIT 1`, [a.gym_id]);
        if (recent.rows.length > 0) {
            await resolveAnomaly(a.id, a.gym_id);
        }
    }
    // Resolve capacity_breach when occupancy drops below 85%
    const capBreaches = await pool_1.default.query(`SELECT a.id, a.gym_id, g.capacity FROM anomalies a
     JOIN gyms g ON g.id = a.gym_id
     WHERE a.type = 'capacity_breach' AND a.resolved = FALSE`);
    for (const a of capBreaches.rows) {
        const occ = await pool_1.default.query(`SELECT COUNT(*) AS cnt FROM checkins WHERE gym_id = $1 AND checked_out IS NULL`, [a.gym_id]);
        const occupancy = parseInt(occ.rows[0].cnt, 10);
        if (occupancy < a.capacity * 0.85) {
            await resolveAnomaly(a.id, a.gym_id);
        }
    }
    // Resolve revenue_drop when revenue recovers within 80% of last week
    const revDrops = await pool_1.default.query(`SELECT id, gym_id FROM anomalies WHERE type = 'revenue_drop' AND resolved = FALSE`);
    for (const a of revDrops.rows) {
        const r = await pool_1.default.query(`
      WITH today_rev AS (
        SELECT COALESCE(SUM(amount), 0) AS revenue
        FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE
      ),
      last_week_rev AS (
        SELECT COALESCE(SUM(amount), 0) AS revenue
        FROM payments
        WHERE gym_id = $1
          AND paid_at >= CURRENT_DATE - INTERVAL '7 days'
          AND paid_at < CURRENT_DATE - INTERVAL '6 days'
      )
      SELECT t.revenue AS today, l.revenue AS last_week
      FROM today_rev t, last_week_rev l
    `, [a.gym_id]);
        if (r.rows.length > 0) {
            const { today, last_week } = r.rows[0];
            if (last_week > 0 && today >= last_week * 0.8) {
                await resolveAnomaly(a.id, a.gym_id);
            }
        }
    }
}
async function resolveAnomaly(anomalyId, gymId) {
    await pool_1.default.query(`UPDATE anomalies SET resolved = TRUE, resolved_at = NOW() WHERE id = $1`, [anomalyId]);
    const evt = {
        type: 'ANOMALY_RESOLVED',
        anomaly_id: anomalyId,
        gym_id: gymId,
        resolved_at: new Date().toISOString(),
    };
    (0, server_1.broadcast)(evt);
    console.log(`[Anomaly] Resolved anomaly ${anomalyId}`);
}
//# sourceMappingURL=anomalyService.js.map