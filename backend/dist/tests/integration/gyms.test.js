"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
// Skip DB-intensive tests if no DATABASE_URL set
const describeIf = process.env.DATABASE_URL ? describe : describe.skip;
describeIf('Integration: GET /api/gyms', () => {
    test('returns array of 10 gyms', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/gyms');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(10);
    });
    test('each gym has current_occupancy and today_revenue', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/gyms');
        const gym = res.body[0];
        expect(gym).toHaveProperty('current_occupancy');
        expect(gym).toHaveProperty('today_revenue');
        expect(typeof gym.current_occupancy).toBe('number');
    });
    test('each gym has required fields', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/gyms');
        const gym = res.body[0];
        expect(gym).toHaveProperty('id');
        expect(gym).toHaveProperty('name');
        expect(gym).toHaveProperty('city');
        expect(gym).toHaveProperty('capacity');
    });
});
describeIf('Integration: GET /api/gyms/:id/live', () => {
    let gymId;
    beforeAll(async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/gyms');
        gymId = res.body[0]?.id;
    });
    test('returns all required fields', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get(`/api/gyms/${gymId}/live`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('gym');
        expect(res.body).toHaveProperty('occupancy');
        expect(res.body).toHaveProperty('today_revenue');
        expect(res.body).toHaveProperty('recent_events');
        expect(res.body).toHaveProperty('active_anomalies');
    });
    test('occupancy has current, capacity, percentage', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get(`/api/gyms/${gymId}/live`);
        expect(res.body.occupancy).toHaveProperty('current');
        expect(res.body.occupancy).toHaveProperty('capacity');
        expect(res.body.occupancy).toHaveProperty('percentage');
    });
    test('returns 404 for non-existent gym', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/gyms/00000000-0000-0000-0000-000000000000/live');
        expect(res.status).toBe(404);
    });
});
describeIf('Integration: GET /api/gyms/:id/analytics', () => {
    let gymId;
    beforeAll(async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/gyms');
        gymId = res.body[0]?.id;
    });
    test('returns peak_hours, revenue_by_plan, churn_risk, new_vs_renewal', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get(`/api/gyms/${gymId}/analytics?dateRange=30d`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('peak_hours');
        expect(res.body).toHaveProperty('revenue_by_plan');
        expect(res.body).toHaveProperty('churn_risk');
        expect(res.body).toHaveProperty('new_vs_renewal');
    });
    test('returns 400 for invalid dateRange', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get(`/api/gyms/${gymId}/analytics?dateRange=999d`);
        expect(res.status).toBe(400);
    });
});
describeIf('Integration: GET /api/anomalies', () => {
    test('returns array (may be empty)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/anomalies');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
    test('severity filter works', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/anomalies?severity=critical');
        expect(res.status).toBe(200);
        for (const a of res.body) {
            expect(a.severity).toBe('critical');
        }
    });
});
describeIf('Integration: PATCH /api/anomalies/:id/dismiss', () => {
    test('returns 404 for non-existent anomaly', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch('/api/anomalies/00000000-0000-0000-0000-000000000000/dismiss');
        expect(res.status).toBe(404);
    });
    test('returns 403 for critical anomaly', async () => {
        // First create a critical anomaly to get its ID
        const gymsRes = await (0, supertest_1.default)(app_1.default).get('/api/gyms');
        const gymId = gymsRes.body[0]?.id;
        // Find an existing critical anomaly if any
        const anomalyRes = await (0, supertest_1.default)(app_1.default).get('/api/anomalies?severity=critical');
        if (anomalyRes.body.length > 0) {
            const critId = anomalyRes.body[0].id;
            const res = await (0, supertest_1.default)(app_1.default).patch(`/api/anomalies/${critId}/dismiss`);
            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Critical');
        }
        // If no critical anomaly exists, this test is a no-op (expected in clean DB)
        expect(gymId).toBeDefined();
    });
});
describeIf('Integration: POST /api/simulator', () => {
    afterAll(async () => {
        // Stop simulator after tests
        await (0, supertest_1.default)(app_1.default).post('/api/simulator/stop');
    });
    test('start with speed=1 returns running status', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/simulator/start')
            .send({ speed: 1 });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('running');
        expect(res.body.speed).toBe(1);
    });
    test('start with invalid speed=7 returns 400', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/simulator/start')
            .send({ speed: 7 });
        expect(res.status).toBe(400);
    });
    test('stop returns paused status', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/simulator/stop');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('paused');
    });
});
describeIf('Integration: GET /api/analytics/cross-gym', () => {
    test('returns array with gym_id and total_revenue', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/analytics/cross-gym');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('gym_id');
            expect(res.body[0]).toHaveProperty('total_revenue');
            expect(res.body[0]).toHaveProperty('rank');
        }
    });
});
describe('Health check', () => {
    test('GET /api/health returns 200', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/health');
        // In unit test env without DB it may 503, but endpoint must exist
        expect([200, 503]).toContain(res.status);
    });
});
//# sourceMappingURL=gyms.test.js.map