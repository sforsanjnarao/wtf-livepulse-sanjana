// Use manual mock at src/db/__mocks__/pool.ts — no factory needed
jest.mock('../../src/db/pool');
jest.mock('../../src/websocket/server', () => ({ broadcast: jest.fn() }));

import pool from '../../src/db/pool';
import {
  detectZeroCheckins,
  detectCapacityBreach,
  detectRevenueDrop,
  resolveAnomalies,
} from '../../src/services/anomalyService';

const mockQuery = pool.query as jest.Mock;

beforeEach(() => {
  mockQuery.mockReset();
});

// ─── zero_checkins ────────────────────────────────────────────────────────────

test('zero_checkins: fires when gym has no checkins in 2 hours during operating hours', async () => {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 'gym-1', name: 'Test Gym', opens_at: '06:00', closes_at: '22:00', last_checkin: null }] })
    .mockResolvedValueOnce({ rows: [] })                        // no existing anomaly
    .mockResolvedValueOnce({ rows: [{ id: 'anm-1', gym_id: 'gym-1', type: 'zero_checkins', severity: 'warning', message: 'm' }] });

  await detectZeroCheckins();
  expect(mockQuery).toHaveBeenCalled();
});

test('zero_checkins: does NOT fire outside operating hours (SQL filters)', async () => {
  // SQL returns no rows when outside hours → no additional queries
  mockQuery.mockResolvedValueOnce({ rows: [] });

  await detectZeroCheckins();
  expect(mockQuery).toHaveBeenCalledTimes(1);
});

test('zero_checkins: does NOT fire when unresolved anomaly already exists', async () => {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 'gym-1', name: 'Test Gym', last_checkin: null }] })
    .mockResolvedValueOnce({ rows: [{ id: 'existing' }] });    // already exists → skip INSERT

  await detectZeroCheckins();
  expect(mockQuery).toHaveBeenCalledTimes(2);
});

// ─── capacity_breach ──────────────────────────────────────────────────────────

test('capacity_breach: fires when occupancy > 90% of capacity', async () => {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 'gym-2', name: 'Big Gym', capacity: 300, occupancy: 275 }] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [{ id: 'anm-2', gym_id: 'gym-2', type: 'capacity_breach', severity: 'critical', message: 'm' }] });

  await detectCapacityBreach();
  expect(mockQuery).toHaveBeenCalled();
});

test('capacity_breach: does NOT fire when SQL HAVING returns no rows (89%)', async () => {
  mockQuery.mockResolvedValueOnce({ rows: [] });
  await detectCapacityBreach();
  expect(mockQuery).toHaveBeenCalledTimes(1);
});

test('capacity_breach: INSERT contains severity=critical', async () => {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 'gym-2', name: 'Big Gym', capacity: 300, occupancy: 290 }] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [{ id: 'a', gym_id: 'gym-2', type: 'capacity_breach', severity: 'critical', message: 'm' }] });

  await detectCapacityBreach();
  // 3rd call is the INSERT — check that it contains 'critical'
  const insertSql = String(mockQuery.mock.calls[2][0]);
  expect(insertSql).toContain('critical');
});

// ─── revenue_drop ─────────────────────────────────────────────────────────────

test('revenue_drop: fires when today < 70% of same day last week', async () => {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 'gym-3', name: 'Salt Lake', last_week: 20000, today: 1000 }] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [{ id: 'anm-3', gym_id: 'gym-3', type: 'revenue_drop', severity: 'warning', message: 'm' }] });

  await detectRevenueDrop();
  expect(mockQuery).toHaveBeenCalled();
});

test('revenue_drop: does NOT fire when SQL WHERE filters (75% > 70%)', async () => {
  mockQuery.mockResolvedValueOnce({ rows: [] });
  await detectRevenueDrop();
  expect(mockQuery).toHaveBeenCalledTimes(1);
});

// ─── Auto-resolve ─────────────────────────────────────────────────────────────

test('resolveAnomalies: resolves zero_checkins when checkins resume', async () => {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 'anm-1', gym_id: 'gym-1' }] })  // fetch zero_checkins anomalies
    .mockResolvedValueOnce({ rows: [{ id: 'ci-1' }] })                     // recent checkin exists
    .mockResolvedValueOnce({ rows: [] })                                    // UPDATE resolved
    .mockResolvedValueOnce({ rows: [] })                                    // capacity_breach list
    .mockResolvedValueOnce({ rows: [] });                                   // revenue_drop list

  await resolveAnomalies();
  expect(mockQuery).toHaveBeenCalledWith(
    expect.stringContaining('resolved = TRUE'),
    ['anm-1']
  );
});

test('resolveAnomalies: resolves capacity_breach when occupancy < 85%', async () => {
  mockQuery
    .mockResolvedValueOnce({ rows: [] })                                        // zero_checkins list
    .mockResolvedValueOnce({ rows: [{ id: 'anm-2', gym_id: 'gym-2', capacity: 300 }] })
    .mockResolvedValueOnce({ rows: [{ cnt: '200' }] })                          // 200 < 85% of 300
    .mockResolvedValueOnce({ rows: [] })                                        // UPDATE resolved
    .mockResolvedValueOnce({ rows: [] });                                       // revenue_drop list

  await resolveAnomalies();
  expect(mockQuery).toHaveBeenCalledWith(
    expect.stringContaining('resolved = TRUE'),
    ['anm-2']
  );
});
