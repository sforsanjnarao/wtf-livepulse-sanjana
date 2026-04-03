# WTF LivePulse — Complete Implementation Plan & HLD

## High-Level Design (HLD)

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Docker Compose Network                       │
│                                                                     │
│  ┌──────────────┐    ┌──────────────────────┐    ┌───────────────┐ │
│  │              │    │                      │    │               │ │
│  │  PostgreSQL  │◄───│   Backend (Node.js)  │◄───│   Frontend    │ │
│  │    :5432     │    │      :3001           │    │  (React) :80  │ │
│  │              │    │                      │    │               │ │
│  │  - gyms      │    │  - REST API (Express)│    │  - Dashboard  │ │
│  │  - members   │    │  - WebSocket (ws)    │    │  - Analytics  │ │
│  │  - checkins  │    │  - Anomaly Detector  │    │  - Anomalies  │ │
│  │  - payments  │    │  - Simulator Engine  │    │  - Simulator  │ │
│  │  - anomalies │    │  - Seed Runner       │    │    Controls   │ │
│  │  - mat. view │    │                      │    │               │ │
│  └──────────────┘    └──────────────────────┘    └───────────────┘ │
│                              │    ▲                       │        │
│                              │    │                       │        │
│                              ▼    │                       │        │
│                        WebSocket (ws://)◄─────────────────┘        │
│                        Port 3001/ws                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  Simulator   │────►│  PostgreSQL  │────►│  Anomaly        │
│  Engine      │     │  (writes)    │     │  Detector       │
│  (every 2s)  │     │              │     │  (every 30s)    │
└──────┬───────┘     └──────────────┘     └────────┬────────┘
       │                                           │
       ▼                                           ▼
┌─────────────────────────────────────────────────────────┐
│              WebSocket Broadcast Server                   │
│  Events: CHECKIN, CHECKOUT, PAYMENT, ANOMALY_DETECTED,   │
│          ANOMALY_RESOLVED                                │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  useWebSocket hook ──► Context Store ──► UI Components   │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack (Confirmed)

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Database    | PostgreSQL 15 (Docker: `postgres:15-alpine`)    |
| Backend     | Node.js 20 + Express 4 + `ws` + TypeScript      |
| Frontend    | React 18 + Vite + TypeScript                    |
| Styling     | TailwindCSS (dark theme)                        |
| Charting    | Recharts                                        |
| State       | React Context                                   |
| WebSocket   | `ws` (backend) + native browser WebSocket API   |
| Infra       | Docker Compose                                  |
| Testing     | Jest + Supertest (backend), Playwright (frontend)|

---

## Repository Structure (EXACT — do not deviate)

```
wtf-livepulse-sanjana/
├── docker-compose.yml
├── .env.example
├── README.md
├── PLAN.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.ts
│   ├── src/
│   │   ├── app.ts                    # Express entry point + startup logic
│   │   ├── routes/
│   │   │   ├── gyms.ts               # GET /api/gyms, GET /api/gyms/:id/live, GET /api/gyms/:id/analytics
│   │   │   ├── anomalies.ts          # GET /api/anomalies, PATCH /api/anomalies/:id/dismiss
│   │   │   ├── analytics.ts          # GET /api/analytics/cross-gym
│   │   │   └── simulator.ts          # POST /api/simulator/start|stop|reset
│   │   ├── services/
│   │   │   ├── anomalyService.ts      # Anomaly detection business logic
│   │   │   ├── simulatorService.ts    # Data simulation engine
│   │   │   └── statsService.ts        # Stats/analytics queries
│   │   ├── db/
│   │   │   ├── pool.ts               # pg Pool singleton
│   │   │   ├── migrations/
│   │   │   │   ├── 001_schema.sql     # All CREATE TABLE + indexes
│   │   │   │   └── 002_materialized_view.sql
│   │   │   └── seeds/
│   │   │       └── seed.ts           # Full seed script (runs on startup if DB empty)
│   │   ├── jobs/
│   │   │   ├── anomalyDetector.ts     # Background job: runs every 30s
│   │   │   └── simulator.ts          # Background job: generates events every 2s
│   │   ├── websocket/
│   │   │   └── server.ts             # WebSocket server + broadcast function
│   │   └── types/
│   │       └── index.ts              # Shared TypeScript interfaces
│   └── tests/
│       ├── unit/
│       │   ├── anomalyService.test.ts
│       │   └── simulatorService.test.ts
│       └── integration/
│           ├── gyms.test.ts
│           ├── anomalies.test.ts
│           └── simulator.test.ts
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── nginx.conf                    # Nginx config for serving + proxying API
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css                 # Tailwind imports + global dark theme
│   │   ├── types/
│   │   │   └── index.ts              # Frontend TypeScript interfaces
│   │   ├── store/
│   │   │   └── GymContext.tsx         # React Context: selected gym, gyms list, live data
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts       # Native WebSocket hook with reconnect
│   │   │   ├── useGymData.ts         # Fetch gym data hook
│   │   │   └── useAnomalies.ts       # Fetch + track anomalies
│   │   ├── components/
│   │   │   ├── Layout.tsx            # Dark shell: sidebar/topbar + main content
│   │   │   ├── GymSelector.tsx       # Dropdown to switch gym
│   │   │   ├── SummaryBar.tsx        # Aggregated totals across all gyms
│   │   │   ├── OccupancyCard.tsx     # Live occupancy counter with color coding
│   │   │   ├── RevenueTicker.tsx     # Today's revenue for selected gym
│   │   │   ├── ActivityFeed.tsx      # Last 20 real-time events (scrolling)
│   │   │   ├── PeakHoursHeatmap.tsx  # 7-day heatmap (Recharts)
│   │   │   ├── RevenueBreakdown.tsx  # Revenue by plan type (Recharts bar/pie)
│   │   │   ├── ChurnRiskPanel.tsx    # Table of at-risk members
│   │   │   ├── NewVsRenewal.tsx      # Donut chart
│   │   │   ├── CrossGymRevenue.tsx   # Bar chart: all gyms ranked by revenue
│   │   │   ├── AnomalyTable.tsx      # Active anomalies table with dismiss
│   │   │   ├── AnomalyBadge.tsx      # Unread anomaly count in nav
│   │   │   ├── SimulatorControls.tsx # Start/Pause, Speed, Reset
│   │   │   ├── LiveIndicator.tsx     # Pulsing green/red dot for WS status
│   │   │   ├── SkeletonLoader.tsx    # Loading skeleton for cards
│   │   │   └── AnimatedNumber.tsx    # Count-up animation for KPIs
│   │   └── pages/
│   │       ├── Dashboard.tsx         # Module 1: Live gym operations
│   │       ├── Analytics.tsx         # Module 2: Analytics engine
│   │       └── Anomalies.tsx         # Module 3: Anomaly log
│   └── tests/
│       └── e2e/
│           └── dashboard.spec.ts     # Playwright E2E tests
│
└── benchmarks/
    └── screenshots/                  # EXPLAIN ANALYZE screenshots (added after DB is running)
```

---

## Feature-by-Feature Implementation Order

Each feature below is a self-contained unit. Build them in order. Each feature builds on the previous one. Do NOT skip ahead.

---

### FEATURE 1: Project Scaffolding + Docker Compose + Database Schema

**Goal:** `docker compose up` boots all 3 services. DB has all tables + indexes. Backend responds to health check. Frontend shows a blank dark page.

**Files to create:**

#### 1.1 `docker-compose.yml` (root)

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: wtf_livepulse
      POSTGRES_USER: wtf
      POSTGRES_PASSWORD: wtf_secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/db/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wtf"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://wtf:wtf_secret@db:5432/wtf_livepulse
      PORT: "3001"
      NODE_ENV: development
    ports:
      - "3001:3001"
    depends_on:
      db:
        condition: service_healthy
    command: node dist/app.js

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### 1.2 `.env.example` (root)

```
DATABASE_URL=postgres://wtf:wtf_secret@db:5432/wtf_livepulse
PORT=3001
NODE_ENV=development
```

#### 1.3 `backend/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx tsc
EXPOSE 3001
CMD ["node", "dist/app.js"]
```

#### 1.4 `backend/package.json`

Dependencies needed:
- `express`, `@types/express`
- `pg`, `@types/pg`
- `ws`, `@types/ws`
- `cors`, `@types/cors`
- `typescript`, `ts-node`
- Dev: `jest`, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest`

#### 1.5 `backend/tsconfig.json`

Target: ES2022, module: commonjs, outDir: dist, rootDir: src, strict: true.

#### 1.6 `backend/src/db/migrations/001_schema.sql`

This file runs automatically by Postgres on first init. It must contain:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============ TABLES ============

CREATE TABLE IF NOT EXISTS gyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    opens_at TIME NOT NULL DEFAULT '06:00',
    closes_at TIME NOT NULL DEFAULT '22:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'annual')),
    member_type TEXT NOT NULL DEFAULT 'new' CHECK (member_type IN ('new', 'renewal')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'frozen')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    plan_expires_at TIMESTAMPTZ NOT NULL,
    last_checkin_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkins (
    id BIGSERIAL PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    checked_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checked_out TIMESTAMPTZ,
    duration_min INTEGER GENERATED ALWAYS AS (
        CASE WHEN checked_out IS NOT NULL
        THEN EXTRACT(EPOCH FROM (checked_out - checked_in))::INTEGER / 60
        ELSE NULL END
    ) STORED
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    plan_type TEXT NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'new' CHECK (payment_type IN ('new', 'renewal')),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('zero_checkins', 'capacity_breach', 'revenue_drop')),
    severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
    message TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ============ INDEXES ============

-- Churn risk: partial index on active members only
CREATE INDEX IF NOT EXISTS idx_members_churn_risk
    ON members (last_checkin_at)
    WHERE status = 'active';

-- Gym-level member queries
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members (gym_id);

-- BRIN index for time-series range queries on checkins (append-only)
CREATE INDEX IF NOT EXISTS idx_checkins_time_brin ON checkins USING BRIN (checked_in);

-- Live occupancy: partial index for checked_out IS NULL
CREATE INDEX IF NOT EXISTS idx_checkins_live_occupancy
    ON checkins (gym_id, checked_out)
    WHERE checked_out IS NULL;

-- Member-level checkin history
CREATE INDEX IF NOT EXISTS idx_checkins_member ON checkins (member_id, checked_in DESC);

-- Today's revenue per gym
CREATE INDEX IF NOT EXISTS idx_payments_gym_date
    ON payments (gym_id, paid_at DESC);

-- Cross-gym revenue comparison
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments (paid_at DESC);

-- Active anomalies: partial index
CREATE INDEX IF NOT EXISTS idx_anomalies_active
    ON anomalies (gym_id, detected_at DESC)
    WHERE resolved = FALSE;
```

#### 1.7 `backend/src/db/migrations/002_materialized_view.sql`

```sql
-- Peak hours heatmap materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS gym_hourly_stats AS
    SELECT
        gym_id,
        EXTRACT(DOW FROM checked_in)::INTEGER AS day_of_week,
        EXTRACT(HOUR FROM checked_in)::INTEGER AS hour_of_day,
        COUNT(*) AS checkin_count
    FROM checkins
    WHERE checked_in >= NOW() - INTERVAL '7 days'
    GROUP BY gym_id, day_of_week, hour_of_day;

CREATE UNIQUE INDEX IF NOT EXISTS idx_gym_hourly_stats_unique
    ON gym_hourly_stats (gym_id, day_of_week, hour_of_day);
```

#### 1.8 `backend/src/db/pool.ts`

```typescript
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export default pool;
```

#### 1.9 `backend/src/app.ts` (minimal — just health check for now)

```typescript
import express from 'express';
import cors from 'cors';
import pool from './db/pool';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
```

#### 1.10 `backend/src/types/index.ts`

```typescript
export interface Gym {
    id: string;
    name: string;
    city: string;
    address: string | null;
    capacity: number;
    status: 'active' | 'inactive' | 'maintenance';
    opens_at: string;
    closes_at: string;
    created_at: string;
    updated_at: string;
}

export interface Member {
    id: string;
    gym_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    plan_type: 'monthly' | 'quarterly' | 'annual';
    member_type: 'new' | 'renewal';
    status: 'active' | 'inactive' | 'frozen';
    joined_at: string;
    plan_expires_at: string;
    last_checkin_at: string | null;
    created_at: string;
}

export interface Checkin {
    id: number;
    member_id: string;
    gym_id: string;
    checked_in: string;
    checked_out: string | null;
    duration_min: number | null;
}

export interface Payment {
    id: string;
    member_id: string;
    gym_id: string;
    amount: number;
    plan_type: string;
    payment_type: 'new' | 'renewal';
    paid_at: string;
    notes: string | null;
}

export interface Anomaly {
    id: string;
    gym_id: string;
    type: 'zero_checkins' | 'capacity_breach' | 'revenue_drop';
    severity: 'warning' | 'critical';
    message: string;
    resolved: boolean;
    dismissed: boolean;
    detected_at: string;
    resolved_at: string | null;
}

// WebSocket event types
export interface CheckinEvent {
    type: 'CHECKIN_EVENT';
    gym_id: string;
    member_name: string;
    timestamp: string;
    current_occupancy: number;
    capacity_pct: number;
}

export interface CheckoutEvent {
    type: 'CHECKOUT_EVENT';
    gym_id: string;
    member_name: string;
    timestamp: string;
    current_occupancy: number;
    capacity_pct: number;
}

export interface PaymentEvent {
    type: 'PAYMENT_EVENT';
    gym_id: string;
    amount: number;
    plan_type: string;
    member_name: string;
    today_total: number;
}

export interface AnomalyDetectedEvent {
    type: 'ANOMALY_DETECTED';
    anomaly_id: string;
    gym_id: string;
    gym_name: string;
    anomaly_type: string;
    severity: string;
    message: string;
}

export interface AnomalyResolvedEvent {
    type: 'ANOMALY_RESOLVED';
    anomaly_id: string;
    gym_id: string;
    resolved_at: string;
}

export type WSEvent = CheckinEvent | CheckoutEvent | PaymentEvent | AnomalyDetectedEvent | AnomalyResolvedEvent;
```

#### 1.11 Frontend setup

- `frontend/Dockerfile`: multi-stage build — node:20-alpine for build, nginx:alpine for serve
- `frontend/nginx.conf`: serve static files, proxy `/api` and `/ws` to `backend:3001`
- `frontend/package.json`: react, react-dom, recharts, tailwindcss, postcss, autoprefixer, typescript, @types/react, @types/react-dom, vite, @vitejs/plugin-react
- `frontend/vite.config.ts`: react plugin, proxy `/api` to `http://backend:3001` for dev
- `frontend/tailwind.config.js`: content paths, dark mode enabled
- `frontend/index.html`: basic HTML with root div
- `frontend/src/main.tsx`: ReactDOM.createRoot
- `frontend/src/App.tsx`: Just renders "WTF LivePulse" text on dark background
- `frontend/src/index.css`: Tailwind directives + body dark background (`bg-[#0D0D1A]`)

**Validation:** `docker compose up` starts all 3 services. `http://localhost:3000` shows dark page. `http://localhost:3001/api/health` returns JSON.

---

### FEATURE 2: Seed Script (Database Population)

**Goal:** On backend startup, if DB is empty, seed all data per the Data Specification PDF exactly.

**File:** `backend/src/db/seeds/seed.ts`

This is the most critical file. It must:

1. **Check if already seeded** — `SELECT COUNT(*) FROM gyms`. If > 0, skip.
2. **Seed 10 gyms** with exact names, cities, capacities, hours from the spec:

| # | Name | City | Capacity | Opens | Closes |
|---|------|------|----------|-------|--------|
| 1 | WTF Gyms — Lajpat Nagar | New Delhi | 220 | 05:30 | 22:30 |
| 2 | WTF Gyms — Connaught Place | New Delhi | 180 | 06:00 | 22:00 |
| 3 | WTF Gyms — Bandra West | Mumbai | 300 | 05:00 | 23:00 |
| 4 | WTF Gyms — Powai | Mumbai | 250 | 05:30 | 22:30 |
| 5 | WTF Gyms — Indiranagar | Bengaluru | 200 | 05:30 | 22:00 |
| 6 | WTF Gyms — Koramangala | Bengaluru | 180 | 06:00 | 22:00 |
| 7 | WTF Gyms — Banjara Hills | Hyderabad | 160 | 06:00 | 22:00 |
| 8 | WTF Gyms — Sector 18 Noida | Noida | 140 | 06:00 | 21:30 |
| 9 | WTF Gyms — Salt Lake | Kolkata | 120 | 06:00 | 21:00 |
| 10 | WTF Gyms — Velachery | Chennai | 110 | 06:00 | 21:00 |

3. **Seed 5,000 members** distributed across gyms:

| Gym | % | Count | Monthly | Quarterly | Annual | Active % |
|-----|---|-------|---------|-----------|--------|----------|
| Lajpat Nagar | 13% | 650 | 50% | 30% | 20% | 88% |
| Connaught Place | 11% | 550 | 40% | 40% | 20% | 85% |
| Bandra West | 15% | 750 | 40% | 40% | 20% | 90% |
| Powai | 12% | 600 | 40% | 40% | 20% | 87% |
| Indiranagar | 11% | 550 | 40% | 40% | 20% | 89% |
| Koramangala | 10% | 500 | 40% | 40% | 20% | 86% |
| Banjara Hills | 9% | 450 | 50% | 30% | 20% | 84% |
| Sector 18 Noida | 8% | 400 | 60% | 25% | 15% | 82% |
| Salt Lake | 6% | 300 | 60% | 30% | 10% | 80% |
| Velachery | 5% | 250 | 60% | 30% | 10% | 78% |

- Member names: use a hardcoded array of 100+ realistic Indian first names and 100+ last names. Randomly combine them.
- Email: `firstname.lastname{random2digit}@gmail.com`
- Phone: 10-digit starting with 9, 8, or 7
- member_type: 80% 'new', 20% 'renewal'
- status: Active % per table above. Remainder: 8% inactive, 4% frozen.
- joined_at: active members = random date within last 90 days. Inactive = 91-180 days ago.
- plan_expires_at: joined_at + 30 (monthly) / 90 (quarterly) / 365 (annual) days.
- **Churn risk members (CRITICAL):**
  - At least 150 active members: last_checkin_at = 45 to 60 days ago (HIGH risk)
  - At least 80 active members: last_checkin_at = more than 60 days ago (CRITICAL risk)
  - Remaining active: last_checkin_at within last 44 days

4. **Seed ~270,000 check-in records** (90 days of history):

- **Use batch inserts** (500-1000 rows per INSERT) — NOT individual inserts
- ~300 check-ins per gym per day on average
- **Hourly multipliers:**
  - 00:00-05:29 → 0.00x (closed)
  - 05:30-06:59 → 0.60x
  - 07:00-09:59 → 1.00x (PEAK)
  - 10:00-11:59 → 0.40x
  - 12:00-13:59 → 0.30x
  - 14:00-16:59 → 0.20x
  - 17:00-20:59 → 0.90x (PEAK)
  - 21:00-22:30 → 0.35x
  - 22:31-23:59 → 0.00x (closed)
- **Day-of-week multipliers:** Mon=1.0, Tue=0.95, Wed=0.90, Thu=0.95, Fri=0.85, Sat=0.70, Sun=0.45
- All historical check-ins (>2 hours old) must have checked_out = checked_in + random(45-90 min)
- **last_checkin_at on members MUST match the actual latest checkins row** — update via subquery after seeding checkins

5. **Pre-seed "currently in gym" open check-ins:**
- Large gyms (Bandra West, Powai): 25-35 open check-ins (checked_out IS NULL)
- Medium gyms (Lajpat Nagar, CP, Indiranagar, Koramangala, Banjara Hills): 15-25 open
- Small gyms (Noida, Salt Lake, Velachery): 8-15 open
- **EXCEPTION — Velachery: 0 open check-ins** (for zero_checkins anomaly test)
- **EXCEPTION — Bandra West: 275-295 open check-ins** (for capacity_breach anomaly test)

6. **Seed payments:**
- Pricing: monthly=1499, quarterly=3999, annual=11999
- Every member gets at least 1 payment at joined_at (±5 min)
- Renewal members (20%) get a second payment at joined_at + plan duration
- **EXCEPTION — Salt Lake revenue drop:**
  - Same weekday 7 days ago: seed 8-10 payments totalling >= 15,000
  - Today: seed 0-2 payments totalling <= 3,000

7. **After all inserts, UPDATE members SET last_checkin_at** via subquery from checkins table.

8. **Refresh materialized view:** `REFRESH MATERIALIZED VIEW gym_hourly_stats`

9. **Print progress to stdout:** "Seeding gyms... done", "Seeding 5000 members... done", etc.

**Integrate into app.ts:** On startup, import and run seed before starting the Express server.

**Validation queries (run these to verify seed):**
- `SELECT COUNT(*) FROM gyms` → 10
- `SELECT COUNT(*) FROM members` → 5000
- `SELECT COUNT(*) FROM members WHERE status = 'active'` → 4100-4400
- `SELECT COUNT(*) FROM checkins` → 250000-300000
- `SELECT COUNT(*) FROM checkins WHERE checked_out IS NULL` → 100-350
- `SELECT COUNT(*) FROM payments` → 5000-6000
- Churn risk count (active, last_checkin_at < 45 days ago) → min 230
- Bandra West open check-ins → 270-300
- Velachery open check-ins → 0

---

### FEATURE 3: Backend REST API — Gyms + Stats

**Goal:** All gym-related API endpoints working.

**Files:** `backend/src/routes/gyms.ts`, `backend/src/services/statsService.ts`

#### 3.1 `GET /api/gyms`

Returns all 10 gyms with current_occupancy and today_revenue:

```sql
-- For each gym, get occupancy
SELECT COUNT(*) FROM checkins WHERE gym_id = $1 AND checked_out IS NULL;

-- For each gym, get today's revenue
SELECT COALESCE(SUM(amount), 0) FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE;
```

Better: do it in a single query with subqueries or LEFT JOINs to avoid N+1.

Response shape:
```json
[{
  "id": "uuid",
  "name": "WTF Gyms — Lajpat Nagar",
  "city": "New Delhi",
  "capacity": 220,
  "current_occupancy": 18,
  "today_revenue": 14990,
  "status": "active"
}]
```

#### 3.2 `GET /api/gyms/:id/live`

Single gym live snapshot. Must complete < 5ms.

Returns: occupancy, today_revenue, recent_events (last 10 checkins), active_anomalies for this gym.

```json
{
  "gym": { "id": "...", "name": "...", "capacity": 220 },
  "occupancy": { "current": 18, "capacity": 220, "percentage": 8.2 },
  "today_revenue": 14990,
  "recent_events": [...],
  "active_anomalies": [...]
}
```

#### 3.3 `GET /api/gyms/:id/analytics`

Query param: `dateRange` = '7d' | '30d' | '90d'

Returns:
- `peak_hours`: rows from gym_hourly_stats for this gym
- `revenue_by_plan`: grouped revenue by plan_type for the date range
- `churn_risk`: active members with last_checkin_at < 45 days ago, for this gym
- `new_vs_renewal`: count of new vs renewal members who joined in the date range

#### 3.4 `statsService.ts`

Contains all the SQL query functions:
- `getGymOccupancy(gymId)` — uses idx_checkins_live_occupancy
- `getTodayRevenue(gymId)` — uses idx_payments_gym_date
- `getChurnRiskMembers(gymId)` — uses idx_members_churn_risk (partial)
- `getPeakHours(gymId)` — queries gym_hourly_stats materialized view
- `getRevenueByPlanType(gymId, dateRange)`
- `getNewVsRenewalRatio(gymId, dateRange)`
- `getCrossGymRevenue()` — uses idx_payments_date

**Register routes in app.ts.**

---

### FEATURE 4: Backend REST API — Anomalies + Analytics

**Files:** `backend/src/routes/anomalies.ts`, `backend/src/routes/analytics.ts`

#### 4.1 `GET /api/anomalies`

Query params: `gym_id` (optional), `severity` (optional).
Returns active (unresolved) anomalies, newest first.

```sql
SELECT a.*, g.name as gym_name
FROM anomalies a
JOIN gyms g ON g.id = a.gym_id
WHERE a.resolved = FALSE
  AND ($1::uuid IS NULL OR a.gym_id = $1)
  AND ($2::text IS NULL OR a.severity = $2)
ORDER BY a.detected_at DESC;
```

#### 4.2 `PATCH /api/anomalies/:id/dismiss`

- Fetch the anomaly
- If severity = 'critical', return **403** `{ error: "Critical anomalies cannot be dismissed" }`
- Otherwise set dismissed = true, return updated record

#### 4.3 `GET /api/analytics/cross-gym`

Revenue comparison across all gyms for last 30 days. Must complete < 2ms.

```sql
SELECT p.gym_id, g.name as gym_name, SUM(p.amount) as total_revenue,
       RANK() OVER (ORDER BY SUM(p.amount) DESC) as rank
FROM payments p
JOIN gyms g ON g.id = p.gym_id
WHERE p.paid_at >= NOW() - INTERVAL '30 days'
GROUP BY p.gym_id, g.name
ORDER BY total_revenue DESC;
```

---

### FEATURE 5: WebSocket Server

**Goal:** Backend broadcasts real-time events to all connected frontend clients.

**File:** `backend/src/websocket/server.ts`

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WSEvent } from '../types';

let wss: WebSocketServer;

export function setupWebSocket(server: Server): void {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws: WebSocket) => {
        console.log('Client connected');
        ws.on('close', () => console.log('Client disconnected'));
    });
}

export function broadcast(event: WSEvent): void {
    if (!wss) return;
    const data = JSON.stringify(event);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}
```

**Update app.ts:** Create HTTP server from Express app, pass to `setupWebSocket()`, then listen.

---

### FEATURE 6: Simulator Engine (Backend)

**Goal:** Background job that generates check-in/checkout/payment events every 2 seconds. Controllable via REST API.

**Files:** `backend/src/jobs/simulator.ts`, `backend/src/services/simulatorService.ts`, `backend/src/routes/simulator.ts`

#### 6.1 `simulatorService.ts`

State: `{ running: boolean, speed: 1 | 5 | 10, intervalId: NodeJS.Timeout | null }`

- `start(speed)`: Sets interval at `2000 / speed` ms. Each tick:
  1. Pick a random gym (weighted by capacity)
  2. Pick a random active member from that gym
  3. 60% chance: check-in event. 40% chance: check-out event (if someone is checked in)
  4. 5% chance: payment event
  5. INSERT into DB
  6. Broadcast via WebSocket
  7. Update member's last_checkin_at

- `stop()`: Clear interval

- `reset()`: Stop + `UPDATE checkins SET checked_out = NOW() WHERE checked_out IS NULL` + re-seed baseline open check-ins

#### 6.2 `routes/simulator.ts`

- `POST /api/simulator/start` — body: `{ speed: 1 | 5 | 10 }`. Returns `{ status: 'running', speed }`
- `POST /api/simulator/stop` — Returns `{ status: 'paused' }`
- `POST /api/simulator/reset` — Returns `{ status: 'reset' }`

Validate speed must be 1, 5, or 10. Return 400 otherwise.

---

### FEATURE 7: Anomaly Detection Engine (Backend)

**Goal:** Background job that runs every 30 seconds, checks 3 anomaly conditions, writes to DB, broadcasts via WebSocket.

**File:** `backend/src/jobs/anomalyDetector.ts`, `backend/src/services/anomalyService.ts`

#### 7.1 `anomalyService.ts`

Three detection functions:

**A. `detectZeroCheckins()`**
```sql
-- For each active gym during operating hours:
-- Check if any check-ins in last 2 hours
SELECT g.id, g.name, g.opens_at, g.closes_at,
       MAX(c.checked_in) as last_checkin
FROM gyms g
LEFT JOIN checkins c ON c.gym_id = g.id AND c.checked_in >= NOW() - INTERVAL '2 hours'
WHERE g.status = 'active'
GROUP BY g.id
HAVING MAX(c.checked_in) IS NULL;
```
- Only fire during operating hours (check current time vs opens_at/closes_at)
- Severity: 'warning'
- Auto-resolve: when a new check-in arrives for that gym

**B. `detectCapacityBreach()`**
```sql
SELECT g.id, g.name, g.capacity, COUNT(c.id) as occupancy
FROM gyms g
JOIN checkins c ON c.gym_id = g.id AND c.checked_out IS NULL
WHERE g.status = 'active'
GROUP BY g.id
HAVING COUNT(c.id) > g.capacity * 0.9;
```
- Severity: 'critical'
- Auto-resolve: when occupancy drops below 85%

**C. `detectRevenueDrop()`**
```sql
-- Compare today's revenue vs same weekday last week
WITH today_rev AS (
    SELECT gym_id, COALESCE(SUM(amount), 0) as revenue
    FROM payments WHERE paid_at >= CURRENT_DATE
    GROUP BY gym_id
),
last_week_rev AS (
    SELECT gym_id, COALESCE(SUM(amount), 0) as revenue
    FROM payments
    WHERE paid_at >= CURRENT_DATE - INTERVAL '7 days'
      AND paid_at < CURRENT_DATE - INTERVAL '6 days'
    GROUP BY gym_id
)
SELECT lw.gym_id, g.name, lw.revenue as last_week, COALESCE(tr.revenue, 0) as today
FROM last_week_rev lw
JOIN gyms g ON g.id = lw.gym_id
LEFT JOIN today_rev tr ON tr.gym_id = lw.gym_id
WHERE COALESCE(tr.revenue, 0) < lw.revenue * 0.7;
```
- Severity: 'warning'
- Auto-resolve: when revenue recovers within 20% of last week

#### 7.2 Auto-resolve logic

Each cycle also checks if existing unresolved anomalies should be resolved:
- zero_checkins: resolve if gym now has check-ins in last 2 hours
- capacity_breach: resolve if occupancy < 85%
- revenue_drop: resolve if today revenue >= last_week_same_day * 0.8

When resolved: `UPDATE anomalies SET resolved = true, resolved_at = NOW() WHERE id = $1`
Then broadcast `ANOMALY_RESOLVED` event.

#### 7.3 `anomalyDetector.ts`

```typescript
import { detectZeroCheckins, detectCapacityBreach, detectRevenueDrop, resolveAnomalies } from '../services/anomalyService';

export function startAnomalyDetector(): void {
    setInterval(async () => {
        await resolveAnomalies();
        await detectZeroCheckins();
        await detectCapacityBreach();
        await detectRevenueDrop();
    }, 30_000); // every 30 seconds

    // Run immediately on startup
    setTimeout(async () => {
        await detectZeroCheckins();
        await detectCapacityBreach();
        await detectRevenueDrop();
    }, 5_000); // 5 seconds after startup
}
```

**Start in app.ts** after seed completes.

---

### FEATURE 8: Frontend — Layout + Context + WebSocket Hook

**Goal:** Dark-themed shell with navigation, gym selector, and real-time WebSocket connection.

#### 8.1 `frontend/src/types/index.ts`

Copy the same interfaces from backend types (Gym, Anomaly, WSEvent, etc.) — or a subset needed by frontend.

#### 8.2 `frontend/src/store/GymContext.tsx`

```typescript
interface GymState {
    gyms: Gym[];
    selectedGymId: string | null;
    occupancyMap: Record<string, number>;  // gym_id -> current occupancy
    revenueMap: Record<string, number>;    // gym_id -> today's revenue
    activityFeed: ActivityEvent[];         // last 20 events
    anomalyCount: number;                  // unread anomalies badge
    wsConnected: boolean;
}
```

Provide `setSelectedGym`, `updateFromWSEvent` actions.

#### 8.3 `frontend/src/hooks/useWebSocket.ts`

- Connect to `ws://localhost:3001/ws` (or relative path via nginx proxy)
- Auto-reconnect on disconnect (exponential backoff, max 5s)
- Parse incoming JSON, dispatch to context
- Track connection status for LiveIndicator

#### 8.4 `frontend/src/hooks/useGymData.ts`

- Fetch `/api/gyms` on mount → populate gyms list
- Fetch `/api/gyms/:id/live` when selectedGymId changes

#### 8.5 `frontend/src/components/Layout.tsx`

Dark shell:
- Left sidebar or top nav with: "WTF LivePulse" branding, nav links (Dashboard, Analytics, Anomalies), anomaly badge
- Use Tailwind: `bg-[#0D0D1A]` body, `bg-[#1A1A2E]` cards
- Text: `text-[#E2E8F0]` primary, `text-[#64748B]` secondary
- Accent color: teal (`#14B8A6`) — used consistently throughout

#### 8.6 `frontend/src/components/GymSelector.tsx`

Dropdown showing all 10 gyms. On change → update selectedGymId in context.

#### 8.7 `frontend/src/components/LiveIndicator.tsx`

Pulsing green dot when WS connected, red when disconnected. Use Tailwind `animate-pulse`.

#### 8.8 `frontend/src/components/SkeletonLoader.tsx`

Animated skeleton loading placeholder for cards while data is fetching.

#### 8.9 `frontend/src/components/AnimatedNumber.tsx`

Smooth count-up animation (300-500ms) when value changes. Use `requestAnimationFrame` or a simple lerp.

#### 8.10 `frontend/src/App.tsx`

Wrap in GymContext provider. Render Layout with basic routing (can use simple state-based page switching — no need for react-router unless you prefer it).

---

### FEATURE 9: Frontend — Dashboard Page (Module 1)

**Goal:** Live gym operations dashboard with all required widgets.

**File:** `frontend/src/pages/Dashboard.tsx`

Renders:
1. **SummaryBar** (top) — aggregated totals across ALL gyms: total checked-in, total today's revenue, active anomaly count
2. **GymSelector** — dropdown to switch gym
3. **OccupancyCard** — large number + percentage + color coding:
   - < 60% → green (`text-green-400`)
   - 60-85% → yellow (`text-yellow-400`)
   - > 85% → red (`text-red-400`)
4. **RevenueTicker** — today's revenue for selected gym, formatted as INR (e.g., "14,990")
5. **ActivityFeed** — scrolling list of last 20 events. Each shows: event type icon, member name, gym name, timestamp. Auto-scrolls on new events. Oldest items auto-removed when >20.
6. **SimulatorControls** — Start/Pause button, Speed selector (1x/5x/10x), Reset button

All widgets update in real-time via WebSocket — no polling.

**Layout:** Use Tailwind grid. 2-3 column layout on desktop. Cards with `bg-[#1A1A2E]` and `rounded-lg`.

---

### FEATURE 10: Frontend — Analytics Page (Module 2)

**Goal:** Analytics charts and data panels.

**File:** `frontend/src/pages/Analytics.tsx`

Fetch data from `GET /api/gyms/:id/analytics?dateRange=7d`

Renders:
1. **PeakHoursHeatmap** — 7-day heatmap grid. X-axis = hour (5am-11pm), Y-axis = day of week. Cell color intensity = checkin_count. Use Recharts or a custom grid with Tailwind.
2. **RevenueBreakdown** — Recharts BarChart or PieChart showing revenue by plan type (monthly, quarterly, annual) for selected gym. Date range filter: 7d/30d/90d buttons.
3. **ChurnRiskPanel** — Table with columns: Member Name, Last Check-in, Days Absent, Risk Level. Risk level color: HIGH = orange, CRITICAL = red.
4. **NewVsRenewal** — Recharts PieChart (donut). Shows % new vs % renewal for last 30 days.
5. **CrossGymRevenue** — Recharts horizontal BarChart. All 10 gyms ranked by total 30-day revenue.

---

### FEATURE 11: Frontend — Anomalies Page (Module 3)

**Goal:** Anomaly log with real-time updates and dismiss functionality.

**File:** `frontend/src/pages/Anomalies.tsx`

Renders:
1. **AnomalyTable** — columns: Gym Name, Anomaly Type, Severity, Time Detected, Status, Actions
   - Severity badges: WARNING = yellow, CRITICAL = red
   - Status: "Active" or "Resolved" (resolved ones stay visible 24h)
   - Actions: Dismiss button (only for warning-level). Clicking shows confirmation dialog. Calls `PATCH /api/anomalies/:id/dismiss`.
   - Critical anomalies: dismiss button disabled/hidden

2. **AnomalyBadge** — in the navigation. Shows count of unresolved anomalies. Updates via WebSocket.

Real-time: when `ANOMALY_DETECTED` WS event arrives → add to table + increment badge + show toast notification. When `ANOMALY_RESOLVED` → mark resolved + decrement badge.

---

### FEATURE 12: Backend Tests

**Goal:** 10+ unit tests, 12+ integration tests.

#### 12.1 Unit Tests — `backend/tests/unit/anomalyService.test.ts`

Test the anomaly detection logic independently (mock the database):

1. `zero_checkins` fires when no check-ins for 2+ hours during operating hours
2. `zero_checkins` does NOT fire outside operating hours
3. `capacity_breach` fires when occupancy > 90% of capacity
4. `capacity_breach` does NOT fire at 89%
5. `revenue_drop` fires when today < 70% of same day last week
6. `revenue_drop` does NOT fire when today = 75% of last week
7. Anomaly auto-resolves when zero_checkins condition clears
8. Anomaly auto-resolves when capacity drops below 85%
9. Anomaly auto-resolves when revenue recovers within 20%
10. Simulator generates events with realistic time distribution (check hourly weights)

#### 12.2 Integration Tests — `backend/tests/integration/gyms.test.ts`, etc.

Using Jest + Supertest against the real Express app (with test DB):

1. `GET /api/gyms` returns array of 10 gyms after seeding
2. `GET /api/gyms` each gym has `current_occupancy` and `today_revenue` fields
3. `GET /api/gyms/:id/live` returns all required fields (occupancy, revenue, events, anomalies)
4. `GET /api/gyms/:id/live` returns 404 for non-existent gym
5. `GET /api/gyms/:id/analytics` returns peak_hours, revenue_by_plan, churn_risk, new_vs_renewal
6. `GET /api/gyms/:id/analytics` validates dateRange query param (400 for invalid)
7. `GET /api/anomalies` returns array (may be empty)
8. `GET /api/anomalies?severity=critical` filters by severity
9. `PATCH /api/anomalies/:id/dismiss` returns 403 when anomaly severity is 'critical'
10. `PATCH /api/anomalies/:id/dismiss` returns 404 for non-existent anomaly
11. `POST /api/simulator/start` with `{ speed: 1 }` returns `{ status: 'running', speed: 1 }`
12. `POST /api/simulator/start` with `{ speed: 7 }` returns 400 (invalid speed)
13. `POST /api/simulator/stop` returns `{ status: 'paused' }`
14. `GET /api/analytics/cross-gym` returns array of all gyms with revenue + rank

**jest.config.ts:** use ts-jest, set testEnvironment to 'node'.

---

### FEATURE 13: Playwright E2E Tests

**File:** `frontend/tests/e2e/dashboard.spec.ts`

Minimum 3 tests:

1. Dashboard loads and displays gym list — verify gym dropdown has 10 options
2. Switching gym in dropdown updates occupancy count — select a different gym, verify occupancy number changes
3. Start simulator → verify activity feed updates within 2 seconds (click start, wait for feed item to appear)

**Playwright config:** headless mode, base URL `http://localhost:3000`.

---

### FEATURE 14: Materialized View Refresh Job

**File:** Update `backend/src/app.ts`

Set up a `setInterval` to refresh the materialized view every 15 minutes:

```typescript
setInterval(async () => {
    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY gym_hourly_stats');
    console.log('Materialized view refreshed');
}, 15 * 60 * 1000);
```

Also refresh once after seed completes.

---

### FEATURE 15: README.md + Benchmarks

**File:** `README.md` at project root

Must contain these 5 sections:

1. **Quick Start** — `docker compose up` — that's it
2. **Architecture Decisions** — explain each index choice (BRIN for time-series checkins, partial index for live occupancy, partial for churn risk, composite for payments), why materialized view for heatmap
3. **AI Tools Used** — list Claude Code and describe what it was used for
4. **Query Benchmarks** — table of all 6 queries with measured execution time (fill in after running EXPLAIN ANALYZE)
5. **Known Limitations** — honest list of anything incomplete

**Benchmarks:** After DB is seeded and running, run EXPLAIN ANALYZE for all 6 queries, screenshot the output, save to `benchmarks/screenshots/`.

---

## Post-Seed Validation Queries

Run these after seeding to confirm correctness:

```sql
-- V1: Exactly 10 gyms
SELECT COUNT(*) FROM gyms;

-- V2: Exactly 5000 members
SELECT COUNT(*) FROM members;

-- V3: Active members between 4100-4400
SELECT COUNT(*) FROM members WHERE status = 'active';

-- V4: Check-ins between 250000-300000
SELECT COUNT(*) FROM checkins;

-- V5: Open check-ins between 100-350
SELECT COUNT(*) FROM checkins WHERE checked_out IS NULL;

-- V6: Payments between 5000-6000
SELECT COUNT(*) FROM payments;

-- V7: Churn risk >= 230
SELECT COUNT(*) FROM members
WHERE last_checkin_at < NOW() - INTERVAL '45 days' AND status = 'active';

-- V8: Bandra West capacity breach setup (270-300)
SELECT COUNT(*) FROM checkins
WHERE gym_id = (SELECT id FROM gyms WHERE name ILIKE '%Bandra%')
AND checked_out IS NULL;

-- V9: Velachery zero check-ins (0)
SELECT COUNT(*) FROM checkins
WHERE gym_id = (SELECT id FROM gyms WHERE name ILIKE '%Velachery%')
AND checked_out IS NULL;

-- V10: Bandra West 30-day revenue (350000-550000)
SELECT SUM(amount) FROM payments
WHERE gym_id = (SELECT id FROM gyms WHERE name ILIKE '%Bandra%')
AND paid_at >= NOW() - INTERVAL '30 days';
```

---

## Implementation Notes for Sonnet

1. **Build feature by feature** in the order listed. Each feature should be complete and testable before moving to the next.
2. **TypeScript everywhere** — both backend and frontend.
3. **No socket.io** — use the native `ws` package on backend and `new WebSocket()` in browser.
4. **No Bootstrap or MUI** — TailwindCSS only.
5. **No class components** — React functional components + hooks only.
6. **Dark theme mandatory** — `bg-[#0D0D1A]` body, `bg-[#1A1A2E]` cards, `text-[#E2E8F0]` primary text.
7. **Batch inserts for seed** — use multi-row VALUES syntax, NOT individual INSERT loops.
8. **All env vars in docker-compose.yml** — no manual .env file needed.
9. **Idempotent seed** — check if data exists before seeding.
10. **Accent color: teal (#14B8A6)** — use consistently for highlights, buttons, active states.
11. **Font: Inter** — import via Google Fonts or include in the build.
12. **Large KPI numbers** — 32-48px font size for occupancy and revenue values.
13. **Number animations** — smooth count-up on KPI changes (300-500ms).
14. **nginx.conf** in frontend must proxy `/api` → `http://backend:3001` and WebSocket `/ws` → `ws://backend:3001`.
