"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statsService_1 = require("../services/statsService");
const router = (0, express_1.Router)();
// GET /api/analytics/cross-gym
router.get('/analytics/cross-gym', async (_req, res) => {
    try {
        const data = await (0, statsService_1.getCrossGymRevenue)();
        res.json(data);
    }
    catch (err) {
        console.error('[GET /api/analytics/cross-gym]', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map