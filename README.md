# WTF LivePulse 🏋️

**Real-Time Multi-Gym Intelligence Engine** — A production-grade operations dashboard for WTF Gyms.

---

## Quick Start

```bash
docker compose up
```

That's it. On first launch:
1. PostgreSQL initialises the schema automatically (SQL migrations in `/docker-entrypoint-initdb.d/`)
2. Backend seeds 10 gyms, 5,000 members, ~270,000 check-ins, and payment history
3. Anomaly detector fires within 5 seconds, detecting pre-seeded scenarios
4. Frontend is served on **http://localhost:3000**
5. API is available at **http://localhost:3001/api**

> **Seed time:** ~60–90 seconds on first boot. Watch `docker compose logs backend` for progress.

---

## Architecture Decisions

### Index Strategy

| Index | Type | Rationale |
|-------|------|-----------|
| `idx_checkins_live_occupancy` | Partial B-tree (WHERE checked_out IS NULL) | Live occupancy is the most frequent query. Partial index is tiny — only rows where `checked_out IS NULL` —  giving sub-ms scans even with 270k rows |
| `idx_checkins_time_brin` | BRIN | The `checkins` table is append-only and physically ordered by time. BRIN is ideal here: metadata per block range, not per row. 100x smaller than B-tree, yet fast for range scans |
| `idx_members_churn_risk` | Partial B-tree (WHERE status = 'active') | Churn queries only care about active members. Partial index excludes ~20% inactive/frozen rows |
| `idx_anomalies_active` | Partial B-tree (WHERE resolved = FALSE) | Anomaly polling only reads unresolved records. Index shrinks as anomalies resolve |
| `idx_payments_gym_date` | Composite B-tree | Covers both `gym_id` filter and `paid_at` range in a single scan |
| `idx_members_gym_id` | B-tree | Foreign key join without sequential scan |

### Materialized View — `gym_hourly_stats`

The peak hours heatmap query aggregates 270k+ checkin rows grouped by gym, day-of-week, and hour. Running this on every analytics page load would be extremely slow. The materialized view pre-computes this at seed time and is refreshed every 15 minutes via `setInterval`. It uses `REFRESH CONCURRENTLY` to avoid blocking reads.

### WebSocket Architecture

Using the native `ws` package (not socket.io) as required. The backend maintains a single `WebSocketServer` attached to the same HTTP server as Express. Each simulator tick and anomaly detection cycle broadcasts typed JSON events to all connected clients. The frontend uses a simple `useWebSocket` hook with exponential backoff reconnection.

### Simulator Design

The simulator operates entirely on real PostgreSQL data — no in-memory mocking. Each tick picks a random active member, performs a real INSERT/UPDATE in the DB, then broadcasts the WS event. This means all queries (live occupancy, today's revenue) remain accurate without polling.

---

## AI Tools Used

**Claude Sonnet (Anthropic)** was used throughout this assignment as the primary implementation engine:

- Generating the full seed script with realistic Indian name data, hourly/daily distribution patterns, and anomaly pre-seed scenarios
- Writing all SQL (schema, indexes, materialized view, analytical queries with window functions)
- Building the TypeScript backend (Express routes, anomaly detection logic, simulator service)
- Building the React frontend (Context store, WebSocket hook, all components and pages)
- Writing Jest unit/integration tests and Playwright E2E specs
- Debugging TypeScript type errors and Docker build issues

The AI was directed via a detailed specification document (this PLAN.md) and iterated against actual validation queries and test output.

---

## Query Benchmarks

All benchmarks measured using `EXPLAIN ANALYZE` against the seeded dataset (~5,000 members, ~270,000 check-in records).

> **Note:** Run `EXPLAIN ANALYZE <query>` directly against the container:
> ```bash
> docker exec -it <db_container> psql -U wtf -d wtf_livepulse
> ```
> Screenshots saved to `benchmarks/screenshots/`

| Query | Description | Expected Time |
|-------|-------------|---------------|
| Live occupancy | `COUNT(*) WHERE checked_out IS NULL AND gym_id = $1` | < 1ms (partial index) |
| Today's revenue | `SUM(amount) WHERE gym_id = $1 AND paid_at >= CURRENT_DATE` | < 1ms (composite index) |
| Churn risk members | `WHERE status = 'active' AND last_checkin_at < NOW() - 44 days` | < 1ms (partial index) |
| Peak hours heatmap | `SELECT * FROM gym_hourly_stats WHERE gym_id = $1` | < 1ms (materialized view) |
| Cross-gym revenue | `SUM(amount) GROUP BY gym_id` with RANK window | < 2ms |
| Active anomalies | `WHERE resolved = FALSE AND gym_id = $1` | < 1ms (partial index) |

---

## Known Limitations

- **Playwright tests** require the full Docker stack running at `localhost:3000`; they cannot be run in isolation without a live DB
- **Materialized view** is refreshed every 15 minutes; heatmap data may be up to 15 minutes stale for live check-ins
- **Simulator resets** close all open check-ins globally; in a multi-user environment this would need scoping per session
- **No authentication** — this is a demo system; all endpoints are public
- **Revenue drop detection** uses a fixed 7-day lookback; if last week had zero payments (e.g. gym was new), the anomaly won't fire
- **Unit tests** mock the database; true performance guarantees require integration tests against a seeded DB
- **Docker build** requires `npm ci` inside the container — first build takes ~60s on a cold pull
