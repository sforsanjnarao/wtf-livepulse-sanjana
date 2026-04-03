"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const simulatorService_1 = require("../services/simulatorService");
const router = (0, express_1.Router)();
// POST /api/simulator/start
router.post('/simulator/start', async (req, res) => {
    const { speed } = req.body;
    if (speed !== 1 && speed !== 5 && speed !== 10) {
        res.status(400).json({ error: 'Invalid speed. Must be 1, 5, or 10.' });
        return;
    }
    (0, simulatorService_1.startSimulator)(speed);
    res.json({ status: 'running', speed });
});
// POST /api/simulator/stop
router.post('/simulator/stop', (_req, res) => {
    (0, simulatorService_1.stopSimulator)();
    res.json({ status: 'paused' });
});
// POST /api/simulator/reset
router.post('/simulator/reset', async (_req, res) => {
    try {
        await (0, simulatorService_1.resetSimulator)();
        res.json({ status: 'reset' });
    }
    catch (err) {
        console.error('[POST /api/simulator/reset]', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/simulator/status
router.get('/simulator/status', (_req, res) => {
    res.json((0, simulatorService_1.getSimulatorStatus)());
});
exports.default = router;
//# sourceMappingURL=simulator.js.map