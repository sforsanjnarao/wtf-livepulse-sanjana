"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const pool_1 = __importDefault(require("./db/pool"));
const server_1 = require("./websocket/server");
const seed_1 = require("./db/seeds/seed");
const anomalyDetector_1 = require("./jobs/anomalyDetector");
// Routes
const gyms_1 = __importDefault(require("./routes/gyms"));
const anomalies_1 = __importDefault(require("./routes/anomalies"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const simulator_1 = __importDefault(require("./routes/simulator"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
    try {
        const result = await pool_1.default.query('SELECT NOW() as time');
        res.json({ status: 'ok', time: result.rows[0]?.time });
    }
    catch (err) {
        res.status(503).json({ status: 'error', message: 'Database unavailable' });
    }
});
// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', gyms_1.default);
app.use('/api', anomalies_1.default);
app.use('/api', analytics_1.default);
app.use('/api', simulator_1.default);
// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
    const PORT = parseInt(process.env.PORT ?? '3001', 10);
    // 1. Verify DB connection
    console.log('[DB] Connecting to database...');
    await pool_1.default.query('SELECT 1');
    console.log('[DB] Connected.');
    // 2. Run seed (idempotent)
    await (0, seed_1.runSeed)();
    // 3. Refresh materialized view every 15 minutes
    setInterval(async () => {
        try {
            await pool_1.default.query('REFRESH MATERIALIZED VIEW CONCURRENTLY gym_hourly_stats');
            console.log('[MatView] gym_hourly_stats refreshed');
        }
        catch (err) {
            console.error('[MatView] Refresh error:', err);
        }
    }, 15 * 60 * 1000);
    // 4. Create HTTP server and attach WebSocket
    const server = http_1.default.createServer(app);
    (0, server_1.setupWebSocket)(server);
    // 5. Start anomaly detector background job
    (0, anomalyDetector_1.startAnomalyDetector)();
    // 6. Start listening
    server.listen(PORT, () => {
        console.log(`[Server] Backend running on http://0.0.0.0:${PORT}`);
    });
    // 7. Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('[Server] Shutting down...');
        server.close(() => {
            pool_1.default.end();
            process.exit(0);
        });
    });
}
bootstrap().catch((err) => {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=app.js.map