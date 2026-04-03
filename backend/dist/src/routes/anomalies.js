"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pool_1 = __importDefault(require("../db/pool"));
const router = (0, express_1.Router)();
// GET /api/anomalies
router.get('/anomalies', async (req, res) => {
    const gymId = req.query['gym_id'];
    const severity = req.query['severity'];
    try {
        const r = await pool_1.default.query(`SELECT a.*, g.name AS gym_name
       FROM anomalies a
       JOIN gyms g ON g.id = a.gym_id
       WHERE a.resolved = FALSE
         AND ($1::uuid IS NULL OR a.gym_id = $1)
         AND ($2::text IS NULL OR a.severity = $2)
       ORDER BY a.detected_at DESC`, [gymId ?? null, severity ?? null]);
        res.json(r.rows);
    }
    catch (err) {
        console.error('[GET /api/anomalies]', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /api/anomalies/:id/dismiss
router.patch('/anomalies/:id/dismiss', async (req, res) => {
    const { id } = req.params;
    try {
        const existing = await pool_1.default.query('SELECT * FROM anomalies WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            res.status(404).json({ error: 'Anomaly not found' });
            return;
        }
        const anomaly = existing.rows[0];
        if (anomaly.severity === 'critical') {
            res.status(403).json({ error: 'Critical anomalies cannot be dismissed' });
            return;
        }
        const r = await pool_1.default.query(`UPDATE anomalies SET dismissed = TRUE WHERE id = $1 RETURNING *`, [id]);
        res.json(r.rows[0]);
    }
    catch (err) {
        console.error('[PATCH /api/anomalies/:id/dismiss]', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=anomalies.js.map