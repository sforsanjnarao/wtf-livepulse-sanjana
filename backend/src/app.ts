import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import pool from './db/pool';
import { setupWebSocket } from './websocket/server';
import { runSeed } from './db/seeds/seed';
import { startAnomalyDetector } from './jobs/anomalyDetector';

// Routes
import gymRoutes from './routes/gyms';
import anomalyRoutes from './routes/anomalies';
import analyticsRoutes from './routes/analytics';
import simulatorRoutes from './routes/simulator';

const app = express();

app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({ status: 'ok', time: result.rows[0]?.time });
  } catch (err) {
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', gymRoutes);
app.use('/api', anomalyRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', simulatorRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  const PORT = parseInt(process.env.PORT ?? '3001', 10);

  // 1. Verify DB connection
  console.log('[DB] Connecting to database...');
  await pool.query('SELECT 1');
  console.log('[DB] Connected.');

  // 2. Run seed (idempotent)
  await runSeed();

  // 3. Refresh materialized view every 15 minutes
  setInterval(async () => {
    try {
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY gym_hourly_stats');
      console.log('[MatView] gym_hourly_stats refreshed');
    } catch (err) {
      console.error('[MatView] Refresh error:', err);
    }
  }, 15 * 60 * 1000);

  // 4. Create HTTP server and attach WebSocket
  const server = http.createServer(app);
  setupWebSocket(server);

  // 5. Start anomaly detector background job
  startAnomalyDetector();

  // 6. Start listening
  server.listen(PORT, () => {
    console.log(`[Server] Backend running on http://0.0.0.0:${PORT}`);
  });

  // 7. Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Server] Shutting down...');
    server.close(() => {
      pool.end();
      process.exit(0);
    });
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

export default app;
