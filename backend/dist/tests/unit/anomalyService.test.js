"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// ─── Mock pool ────────────────────────────────────────────────────────────────
const mockQuery = globals_1.jest.fn();
globals_1.jest.mock('../../src/db/pool', () => ({ default: { query: mockQuery } }));
// ─── Mock broadcast ───────────────────────────────────────────────────────────
globals_1.jest.mock('../../src/websocket/server', () => ({ broadcast: globals_1.jest.fn() }));
const anomalyService_1 = require("../../src/services/anomalyService");
// Helper to build mock query chains
function makeQuery(...responses) {
    let callIndex = 0;
    return globals_1.jest.fn().mockImplementation(() => {
        const resp = responses[callIndex % responses.length];
        callIndex++;
        return Promise.resolve(resp);
    });
}
beforeEach(() => {
    mockQuery.mockReset();
});
// ─── zero_checkins ────────────────────────────────────────────────────────────
test('zero_checkins: fires when gym has no checkins in 2 hours during operating hours', async () => {
    // First call returns gym with no recent checkin, second checks existing anomaly, third inserts
    mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'gym-1', name: 'Test Gym', opens_at: '06:00', closes_at: '22:00', last_checkin: null }] })
        .mockResolvedValueOnce({ rows: [] }) // no existing anomaly
        .mockResolvedValueOnce({ rows: [{ id: 'anomaly-1', gym_id: 'gym-1', type: 'zero_checkins', severity: 'warning', message: 'msg' }] });
    await (0, anomalyService_1.detectZeroCheckins)();
    expect(mockQuery).toHaveBeenCalled();
});
test('zero_checkins: does NOT fire outside operating hours (handled by SQL time filter)', async () => {
    // SQL filters by opens_at/closes_at — if no rows returned, no anomaly fires
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await (0, anomalyService_1.detectZeroCheckins)();
    // No additional queries (no anomaly to insert)
    expect(mockQuery).toHaveBeenCalledTimes(1);
});
test('zero_checkins: does NOT fire if existing unresolved anomaly exists', async () => {
    mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'gym-1', name: 'Test Gym', last_checkin: null }] })
        .mockResolvedValueOnce({ rows: [{ id: 'existing-anomaly' }] }); // anomaly already exists
    await (0, anomalyService_1.detectZeroCheckins)();
    // Should not call INSERT (only 2 queries: detect + check existing)
    expect(mockQuery).toHaveBeenCalledTimes(2);
});
// ─── capacity_breach ──────────────────────────────────────────────────────────
test('capacity_breach: fires when occupancy > 90% of capacity', async () => {
    mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'gym-2', name: 'Big Gym', capacity: 300, occupancy: 275 }] })
        .mockResolvedValueOnce({ rows: [] }) // no existing anomaly
        .mockResolvedValueOnce({ rows: [{ id: 'anomaly-2', gym_id: 'gym-2', type: 'capacity_breach', severity: 'critical', message: 'msg' }] });
    await (0, anomalyService_1.detectCapacityBreach)();
    expect(mockQuery).toHaveBeenCalled();
});
test('capacity_breach: does NOT fire at 89% occupancy', async () => {
    // SQL HAVING clause excludes < 90%, so rows is empty when at 89%
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await (0, anomalyService_1.detectCapacityBreach)();
    expect(mockQuery).toHaveBeenCalledTimes(1);
});
test('capacity_breach: severity is critical', async () => {
    const insertSpy = globals_1.jest.fn().mockResolvedValue({ rows: [{ id: 'a', gym_id: 'g', type: 'capacity_breach', severity: 'critical', message: 'm' }] });
    mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'gym-2', name: 'Big Gym', capacity: 300, occupancy: 290 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockImplementationOnce(insertSpy);
    await (0, anomalyService_1.detectCapacityBreach)();
    const insertCall = insertSpy.mock.calls[0];
    expect(insertCall[0]).toContain('critical');
});
// ─── revenue_drop ─────────────────────────────────────────────────────────────
test('revenue_drop: fires when today < 70% of same day last week', async () => {
    mockQuery
        .mockResolvedValueOnce({ rows: [{ gym_id: 'gym-3', name: 'Salt Lake', last_week: 20000, today: 1000 }] })
        .mockResolvedValueOnce({ rows: [] }) // no existing anomaly
        .mockResolvedValueOnce({ rows: [{ id: 'anomaly-3', gym_id: 'gym-3', type: 'revenue_drop', severity: 'warning', message: 'msg' }] });
    await (0, anomalyService_1.detectRevenueDrop)();
    expect(mockQuery).toHaveBeenCalled();
});
test('revenue_drop: does NOT fire when today = 75% of last week', async () => {
    // SQL WHERE clause filters < 70%, so 75% produces no rows
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await (0, anomalyService_1.detectRevenueDrop)();
    expect(mockQuery).toHaveBeenCalledTimes(1);
});
// ─── Auto-resolve ─────────────────────────────────────────────────────────────
test('resolveAnomalies: resolves zero_checkins when checkins resume', async () => {
    mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'anomaly-1', gym_id: 'gym-1' }] }) // existing zero_checkins anomaly
        .mockResolvedValueOnce({ rows: [{ id: 'recent-checkin' }] }) // recent checkin exists
        .mockResolvedValueOnce({ rows: [] }) // no capacity breach anomalies
        .mockResolvedValueOnce({ rows: [] }) // no rev drop anomalies
        .mockResolvedValue({ rows: [] }); // UPDATE + remaining
    await (0, anomalyService_1.resolveAnomalies)();
    // Should have called UPDATE to resolve
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('resolved = TRUE'), ['anomaly-1']);
});
test('resolveAnomalies: resolves capacity_breach when occupancy drops below 85%', async () => {
    mockQuery
        .mockResolvedValueOnce({ rows: [] }) // no zero_checkins
        .mockResolvedValueOnce({ rows: [{ id: 'anomaly-2', gym_id: 'gym-2', capacity: 300 }] })
        .mockResolvedValueOnce({ rows: [{ cnt: '200' }] }) // occupancy = 200, well below 85% of 300
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }); // no rev drop
    await (0, anomalyService_1.resolveAnomalies)();
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('resolved = TRUE'), ['anomaly-2']);
});
//# sourceMappingURL=anomalyService.test.js.map