"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeed = runSeed;
const pool_1 = __importDefault(require("../pool"));
// ─── Name data ───────────────────────────────────────────────────────────────
const FIRST_NAMES = [
    'Aarav', 'Aditya', 'Akash', 'Amit', 'Ananya', 'Anika', 'Ankit', 'Anshul', 'Arjun', 'Aryan',
    'Ayaan', 'Ayesha', 'Deepak', 'Deepika', 'Dev', 'Devika', 'Dhruv', 'Divya', 'Farhan', 'Gaurav',
    'Geeta', 'Harsh', 'Himanshu', 'Isha', 'Ishaan', 'Jatin', 'Kavya', 'Kiran', 'Kriti', 'Kunal',
    'Lakshmi', 'Lavanya', 'Madhav', 'Manish', 'Meera', 'Mihir', 'Mira', 'Mohit', 'Monika', 'Naveen',
    'Neha', 'Nikhil', 'Nisha', 'Nitesh', 'Pallavi', 'Payal', 'Pooja', 'Praful', 'Priya', 'Priyanka',
    'Pushkar', 'Rahul', 'Rajan', 'Rajesh', 'Rakesh', 'Ramesh', 'Ravi', 'Ritika', 'Rohit', 'Rohan',
    'Roshani', 'Sachin', 'Sahil', 'Sanjay', 'Sanjana', 'Sanjog', 'Sarika', 'Saurabh', 'Shikha', 'Shivam',
    'Shreya', 'Shruti', 'Shubham', 'Simran', 'Sneha', 'Soham', 'Sonali', 'Subhash', 'Suhas', 'Sumit',
    'Suresh', 'Sushant', 'Swati', 'Tanisha', 'Tanmay', 'Tanya', 'Umesh', 'Urvashi', 'Vaibhav', 'Vandana',
    'Vijay', 'Vikas', 'Vikram', 'Vinay', 'Vishwas', 'Yash', 'Yashvi', 'Zara', 'Bhavesh', 'Chinmay',
];
const LAST_NAMES = [
    'Agarwal', 'Ahuja', 'Arora', 'Bahl', 'Bajaj', 'Bansal', 'Batra', 'Bedi', 'Bhatt', 'Chadha',
    'Chauhan', 'Chopra', 'Datta', 'Dhawan', 'Dua', 'Goel', 'Grover', 'Gupta', 'Iyer', 'Jain',
    'Joshi', 'Kapoor', 'Kaur', 'Khatri', 'Khanna', 'Kumar', 'Lal', 'Luthra', 'Malhotra', 'Mehta',
    'Menon', 'Mishra', 'Nair', 'Nanda', 'Narang', 'Negi', 'Oberoi', 'Pande', 'Pandey', 'Patel',
    'Pillai', 'Prasad', 'Rao', 'Rastogi', 'Reddy', 'Sahni', 'Saxena', 'Sen', 'Seth', 'Sethi',
    'Sharma', 'Shukla', 'Singh', 'Sinha', 'Suri', 'Taneja', 'Thakur', 'Tripathi', 'Varma', 'Verma',
    'Walia', 'Yadav', 'Zaidi', 'Bose', 'Chandra', 'Das', 'Dey', 'Ghosh', 'Roy', 'Basu',
    'Chakraborty', 'Mukherjee', 'Banerjee', 'Sen', 'Soni', 'Tiwari', 'Upadhyay', 'Vyas', 'Pal', 'Nair',
    'Krishnan', 'Subramaniam', 'Ramachandran', 'Narayanan', 'Krishnaswamy', 'Balakrishnan', 'Murthy', 'Hegde', 'Kulkarni', 'Desai',
    'Patil', 'Pawar', 'Jadhav', 'Bhosale', 'Shinde', 'More', 'Bhat', 'Naik', 'Gaikwad', 'Salunkhe',
];
// ─── Gym definitions ─────────────────────────────────────────────────────────
const GYMS = [
    { name: 'WTF Gyms — Lajpat Nagar', city: 'New Delhi', capacity: 220, opens_at: '05:30', closes_at: '22:30', pct: 0.13 },
    { name: 'WTF Gyms — Connaught Place', city: 'New Delhi', capacity: 180, opens_at: '06:00', closes_at: '22:00', pct: 0.11 },
    { name: 'WTF Gyms — Bandra West', city: 'Mumbai', capacity: 300, opens_at: '05:00', closes_at: '23:00', pct: 0.15 },
    { name: 'WTF Gyms — Powai', city: 'Mumbai', capacity: 250, opens_at: '05:30', closes_at: '22:30', pct: 0.12 },
    { name: 'WTF Gyms — Indiranagar', city: 'Bengaluru', capacity: 200, opens_at: '05:30', closes_at: '22:00', pct: 0.11 },
    { name: 'WTF Gyms — Koramangala', city: 'Bengaluru', capacity: 180, opens_at: '06:00', closes_at: '22:00', pct: 0.10 },
    { name: 'WTF Gyms — Banjara Hills', city: 'Hyderabad', capacity: 160, opens_at: '06:00', closes_at: '22:00', pct: 0.09 },
    { name: 'WTF Gyms — Sector 18 Noida', city: 'Noida', capacity: 140, opens_at: '06:00', closes_at: '21:30', pct: 0.08 },
    { name: 'WTF Gyms — Salt Lake', city: 'Kolkata', capacity: 120, opens_at: '06:00', closes_at: '21:00', pct: 0.06 },
    { name: 'WTF Gyms — Velachery', city: 'Chennai', capacity: 110, opens_at: '06:00', closes_at: '21:00', pct: 0.05 },
];
const GYM_MEMBER_CONFIG = [
    { monthly: 0.50, quarterly: 0.30, annual: 0.20, activePct: 0.88 },
    { monthly: 0.40, quarterly: 0.40, annual: 0.20, activePct: 0.85 },
    { monthly: 0.40, quarterly: 0.40, annual: 0.20, activePct: 0.90 },
    { monthly: 0.40, quarterly: 0.40, annual: 0.20, activePct: 0.87 },
    { monthly: 0.40, quarterly: 0.40, annual: 0.20, activePct: 0.89 },
    { monthly: 0.40, quarterly: 0.40, annual: 0.20, activePct: 0.86 },
    { monthly: 0.50, quarterly: 0.30, annual: 0.20, activePct: 0.84 },
    { monthly: 0.60, quarterly: 0.25, annual: 0.15, activePct: 0.82 },
    { monthly: 0.60, quarterly: 0.30, annual: 0.10, activePct: 0.80 },
    { monthly: 0.60, quarterly: 0.30, annual: 0.10, activePct: 0.78 },
];
// ─── Hourly weights ───────────────────────────────────────────────────────────
function getHourlyWeight(hour) {
    if (hour < 5 || hour >= 23)
        return 0;
    if (hour < 7)
        return 0.6;
    if (hour < 10)
        return 1.0;
    if (hour < 12)
        return 0.4;
    if (hour < 14)
        return 0.3;
    if (hour < 17)
        return 0.2;
    if (hour < 21)
        return 0.9;
    return 0.35;
}
const DOW_WEIGHTS = [0.45, 1.0, 0.95, 0.90, 0.95, 0.85, 0.70]; // Sun=0, Mon=1, ...Sat=6
// ─── Helpers ─────────────────────────────────────────────────────────────────
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
}
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
}
function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
function randomHourInDay(baseDate, hour) {
    const d = new Date(baseDate);
    d.setHours(hour, rand(0, 59), rand(0, 59), 0);
    return d;
}
// ─── Pick a weighted random hour ─────────────────────────────────────────────
function pickWeightedHour() {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const weights = hours.map(getHourlyWeight);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < hours.length; i++) {
        r -= weights[i];
        if (r <= 0)
            return hours[i];
    }
    return 7; // fallback
}
// ─── Main seed ───────────────────────────────────────────────────────────────
async function runSeed() {
    const existsResult = await pool_1.default.query('SELECT COUNT(*) as count FROM gyms');
    const count = parseInt(existsResult.rows[0]?.count ?? '0', 10);
    if (count > 0) {
        console.log(`[Seed] Already seeded (${count} gyms). Skipping.`);
        return;
    }
    console.log('[Seed] Starting full database seed...');
    // ── 1. Gyms ────────────────────────────────────────────────────────────────
    console.log('[Seed] Seeding gyms...');
    const gymIds = [];
    for (const g of GYMS) {
        const r = await pool_1.default.query(`INSERT INTO gyms (name, city, capacity, opens_at, closes_at, status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id`, [g.name, g.city, g.capacity, g.opens_at, g.closes_at]);
        gymIds.push(r.rows[0].id);
    }
    console.log('[Seed] Seeding gyms... done');
    // ── 2. Members ─────────────────────────────────────────────────────────────
    console.log('[Seed] Seeding 5000 members...');
    const TOTAL_MEMBERS = 5000;
    // Track members that need churn risk treatment
    let churnHighCount = 0;
    let churnCriticalCount = 0;
    const CHURN_HIGH_NEEDED = 150;
    const CHURN_CRITICAL_NEEDED = 80;
    const allMembers = [];
    const memberRows = [];
    const gymMemberCounts = GYMS.map((g) => Math.round(TOTAL_MEMBERS * g.pct));
    // Adjust last gym to ensure exactly 5000
    const currentTotal = gymMemberCounts.reduce((a, b) => a + b, 0);
    gymMemberCounts[gymMemberCounts.length - 1] += TOTAL_MEMBERS - currentTotal;
    for (let gi = 0; gi < GYMS.length; gi++) {
        const gymnasIds = gymIds[gi];
        const cfg = GYM_MEMBER_CONFIG[gi];
        const count_for_gym = gymMemberCounts[gi];
        for (let mi = 0; mi < count_for_gym; mi++) {
            const firstName = pickRandom(FIRST_NAMES);
            const lastName = pickRandom(LAST_NAMES);
            const name = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${rand(10, 99)}@gmail.com`;
            const phonePrefix = pickRandom(['9', '8', '7']);
            const phone = phonePrefix + Array.from({ length: 9 }, () => rand(0, 9)).join('');
            // Plan type
            const planRoll = Math.random();
            let plan_type;
            if (planRoll < cfg.monthly)
                plan_type = 'monthly';
            else if (planRoll < cfg.monthly + cfg.quarterly)
                plan_type = 'quarterly';
            else
                plan_type = 'annual';
            // Member type: 80% new, 20% renewal
            const member_type = Math.random() < 0.80 ? 'new' : 'renewal';
            // Status
            const statusRoll = Math.random();
            let status;
            if (statusRoll < cfg.activePct)
                status = 'active';
            else if (statusRoll < cfg.activePct + 0.08)
                status = 'inactive';
            else
                status = 'frozen';
            // joined_at
            let joined_at;
            if (status === 'active')
                joined_at = daysAgo(rand(1, 90));
            else
                joined_at = daysAgo(rand(91, 180)); // inactive members joined longer ago
            // plan_expires_at
            const planDays = plan_type === 'monthly' ? 30 : plan_type === 'quarterly' ? 90 : 365;
            const plan_expires_at = addDays(joined_at, planDays);
            // Assign churn risk
            let churnRisk = null;
            if (status === 'active') {
                if (churnCriticalCount < CHURN_CRITICAL_NEEDED) {
                    churnRisk = 'CRITICAL';
                    churnCriticalCount++;
                }
                else if (churnHighCount < CHURN_HIGH_NEEDED) {
                    churnRisk = 'HIGH';
                    churnHighCount++;
                }
            }
            memberRows.push([
                gymnasIds,
                name,
                email,
                phone,
                plan_type,
                member_type,
                status,
                joined_at.toISOString(),
                plan_expires_at.toISOString(),
                'now',
            ]);
            allMembers.push({
                id: '', // filled after insert
                gym_id: gymnasIds,
                gym_idx: gi,
                status,
                plan_type,
                member_type,
                joined_at,
                plan_expires_at,
                churn_risk: churnRisk,
            });
        }
    }
    // Batch insert members
    const BATCH = 500;
    let insertedIdx = 0;
    for (let i = 0; i < memberRows.length; i += BATCH) {
        const chunk = memberRows.slice(i, i + BATCH);
        const values = [];
        const placeholders = chunk.map((_, ci) => {
            const base = ci * 9 + 1;
            values.push(chunk[ci][0], // gym_id
            chunk[ci][1], // name
            chunk[ci][2], // email
            chunk[ci][3], // phone
            chunk[ci][4], // plan_type
            chunk[ci][5], // member_type
            chunk[ci][6], // status
            chunk[ci][7], // joined_at
            chunk[ci][8]);
            return `($${base},$${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`;
        });
        const result = await pool_1.default.query(`INSERT INTO members (gym_id, name, email, phone, plan_type, member_type, status, joined_at, plan_expires_at)
       VALUES ${placeholders.join(',')} RETURNING id`, values);
        for (let j = 0; j < result.rows.length; j++) {
            allMembers[insertedIdx + j].id = result.rows[j].id;
        }
        insertedIdx += chunk.length;
    }
    console.log('[Seed] Seeding 5000 members... done');
    // Group members by gym index
    const membersByGym = Array.from({ length: GYMS.length }, () => []);
    for (const m of allMembers) {
        membersByGym[m.gym_idx].push(m);
    }
    // ── 3. Check-ins (90 days) ────────────────────────────────────────────────
    console.log('[Seed] Seeding 90 days of check-ins...');
    // We'll collect all historical checkins in batches
    const CHECKIN_BATCH = 800;
    let ciBuffer = [];
    async function flushCheckins() {
        if (ciBuffer.length === 0)
            return;
        const values = [];
        const placeholders = ciBuffer.map((_, i) => {
            const base = i * 4 + 1;
            values.push(ciBuffer[i].member_id, ciBuffer[i].gym_id, ciBuffer[i].checked_in.toISOString(), ciBuffer[i].checked_out.toISOString());
            return `($${base},$${base + 1},$${base + 2},$${base + 3})`;
        });
        await pool_1.default.query(`INSERT INTO checkins (member_id, gym_id, checked_in, checked_out) VALUES ${placeholders.join(',')}`, values);
        ciBuffer = [];
    }
    const now = new Date();
    const DAILY_BASE = 300; // ~300 checkins per gym per day
    for (let gi = 0; gi < GYMS.length; gi++) {
        const gymMembers = membersByGym[gi].filter(m => m.status === 'active');
        if (gymMembers.length === 0)
            continue;
        const gymId = gymIds[gi];
        for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
            const dayDate = daysAgo(dayOffset);
            const dow = dayDate.getDay(); // 0=Sun, 6=Sat
            const dowMultiplier = DOW_WEIGHTS[dow];
            const dailyTarget = Math.round(DAILY_BASE * dowMultiplier);
            let generated = 0;
            while (generated < dailyTarget) {
                const member = pickRandom(gymMembers);
                const hour = pickWeightedHour();
                const checked_in = randomHourInDay(dayDate, hour);
                // Only past check-ins
                if (checked_in >= now)
                    continue;
                // Check-out: all historical checkins are > 2 hours old, so they're all checked out
                const checked_out = addMinutes(checked_in, rand(45, 90));
                ciBuffer.push({ member_id: member.id, gym_id: gymId, checked_in, checked_out });
                generated++;
                if (ciBuffer.length >= CHECKIN_BATCH) {
                    await flushCheckins();
                }
            }
        }
    }
    await flushCheckins();
    console.log('[Seed] Seeding 90 days of check-ins... done');
    // ── 4. Open check-ins (currently in gym) ─────────────────────────────────
    console.log('[Seed] Pre-seeding open check-ins...');
    const openCheckinConfig = [
        { gi: 0, min: 15, max: 25 }, // Lajpat Nagar: medium
        { gi: 1, min: 15, max: 25 }, // Connaught Place: medium
        { gi: 2, min: 275, max: 290 }, // Bandra West: capacity breach (>270!)
        { gi: 3, min: 25, max: 35 }, // Powai: large
        { gi: 4, min: 15, max: 25 }, // Indiranagar: medium
        { gi: 5, min: 15, max: 25 }, // Koramangala: medium
        { gi: 6, min: 15, max: 25 }, // Banjara Hills: medium
        { gi: 7, min: 8, max: 15 }, // Noida: small
        { gi: 8, min: 8, max: 15 }, // Salt Lake: small
        // gi: 9 = Velachery → 0 open checkins (zero_checkins anomaly test)
    ];
    for (const cfg of openCheckinConfig) {
        const gymMembers = membersByGym[cfg.gi].filter(m => m.status === 'active');
        const openCount = rand(cfg.min, cfg.max);
        const shuffled = [...gymMembers].sort(() => Math.random() - 0.5).slice(0, openCount);
        const openValues = [];
        const openPlaceholders = shuffled.map((m, i) => {
            const base = i * 3 + 1;
            const checkedIn = addMinutes(now, -rand(10, 90)); // checked in 10-90 mins ago
            openValues.push(m.id, gymIds[cfg.gi], checkedIn.toISOString());
            return `($${base},$${base + 1},$${base + 2})`;
        });
        if (openPlaceholders.length > 0) {
            await pool_1.default.query(`INSERT INTO checkins (member_id, gym_id, checked_in) VALUES ${openPlaceholders.join(',')}`, openValues);
        }
    }
    // Velachery: make sure last checkin was >2 hours ago (already handled by 0 open checkins)
    // Update the most recent Velachery checkin to be > 2 hours ago if needed
    await pool_1.default.query(`
    UPDATE checkins
    SET checked_in = NOW() - INTERVAL '3 hours',
        checked_out = NOW() - INTERVAL '2 hours 5 minutes'
    WHERE id = (
      SELECT id FROM checkins
      WHERE gym_id = $1
      ORDER BY checked_in DESC
      LIMIT 1
    )
  `, [gymIds[9]]);
    console.log('[Seed] Pre-seeding open check-ins... done');
    // ── 5. Update last_checkin_at on members ─────────────────────────────────
    console.log('[Seed] Updating member last_checkin_at...');
    await pool_1.default.query(`
    UPDATE members m
    SET last_checkin_at = sub.latest
    FROM (
      SELECT member_id, MAX(checked_in) as latest
      FROM checkins
      GROUP BY member_id
    ) sub
    WHERE m.id = sub.member_id
  `);
    // Override churn risk members: ensure they haven't checked in recently
    // HIGH risk: 45-60 days ago
    // CRITICAL risk: >60 days ago
    const highRiskMembers = allMembers.filter(m => m.churn_risk === 'HIGH' && m.status === 'active');
    const criticalRiskMembers = allMembers.filter(m => m.churn_risk === 'CRITICAL' && m.status === 'active');
    for (const m of highRiskMembers) {
        const daysBack = rand(45, 60);
        await pool_1.default.query(`UPDATE members SET last_checkin_at = NOW() - ($1 || ' days')::INTERVAL WHERE id = $2`, [daysBack, m.id]);
    }
    for (const m of criticalRiskMembers) {
        const daysBack = rand(61, 90);
        await pool_1.default.query(`UPDATE members SET last_checkin_at = NOW() - ($1 || ' days')::INTERVAL WHERE id = $2`, [daysBack, m.id]);
    }
    console.log('[Seed] Updating member last_checkin_at... done');
    // ── 6. Payments ───────────────────────────────────────────────────────────
    console.log('[Seed] Seeding payments...');
    const PLAN_PRICE = { monthly: 1499, quarterly: 3999, annual: 11999 };
    const payBuffer = [];
    async function flushPayments() {
        if (payBuffer.length === 0)
            return;
        const values = [];
        const placeholders = payBuffer.map((p, i) => {
            const base = i * 6 + 1;
            values.push(p.member_id, p.gym_id, p.amount, p.plan_type, p.payment_type, p.paid_at.toISOString());
            return `($${base},$${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5})`;
        });
        await pool_1.default.query(`INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at)
       VALUES ${placeholders.join(',')}`, values);
        payBuffer.length = 0;
    }
    for (const m of allMembers) {
        const amount = PLAN_PRICE[m.plan_type];
        const paid_at = addMinutes(m.joined_at, rand(-5, 5));
        payBuffer.push({
            member_id: m.id,
            gym_id: m.gym_id,
            amount,
            plan_type: m.plan_type,
            payment_type: 'new',
            paid_at,
        });
        // Renewal members get a second payment
        if (m.member_type === 'renewal') {
            const planDays = m.plan_type === 'monthly' ? 30 : m.plan_type === 'quarterly' ? 90 : 365;
            const renewalDate = addDays(m.joined_at, planDays);
            if (renewalDate <= now) {
                payBuffer.push({
                    member_id: m.id,
                    gym_id: m.gym_id,
                    amount,
                    plan_type: m.plan_type,
                    payment_type: 'renewal',
                    paid_at: addMinutes(renewalDate, rand(-5, 5)),
                });
            }
        }
        if (payBuffer.length >= 800) {
            await flushPayments();
        }
    }
    await flushPayments();
    // ── Salt Lake revenue drop scenario ───────────────────────────────────────
    // Same weekday 7 days ago: seed 8-10 payments totalling >= 15,000
    // Today: seed 0-2 payments totalling <= 3,000
    const saltLakeId = gymIds[8]; // index 8 = Salt Lake
    const saltLakeMembers = membersByGym[8].filter(m => m.status === 'active');
    // Last week: ~10 payments totaling ~20,000+
    const lastWeekDay = new Date(now);
    lastWeekDay.setDate(lastWeekDay.getDate() - 7);
    lastWeekDay.setHours(10, 0, 0, 0);
    for (let i = 0; i < 10; i++) {
        const m = pickRandom(saltLakeMembers);
        const paid_at = addMinutes(lastWeekDay, rand(0, 480));
        await pool_1.default.query(`INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at)
       VALUES ($1, $2, $3, $4, 'new', $5)`, [m.id, saltLakeId, 1999, 'quarterly', paid_at.toISOString()]);
    }
    // Today: 1 payment of 1499
    const todayMorning = new Date(now);
    todayMorning.setHours(7, 0, 0, 0);
    const saltMember = pickRandom(saltLakeMembers);
    await pool_1.default.query(`INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at)
     VALUES ($1, $2, $3, $4, 'new', $5)`, [saltMember.id, saltLakeId, 1499, 'monthly', todayMorning.toISOString()]);
    console.log('[Seed] Seeding payments... done');
    // ── 7. Refresh materialized view ─────────────────────────────────────────
    console.log('[Seed] Refreshing materialized view...');
    await pool_1.default.query('REFRESH MATERIALIZED VIEW gym_hourly_stats');
    console.log('[Seed] Refreshing materialized view... done');
    console.log('[Seed] ✅ Database seed complete!');
}
//# sourceMappingURL=seed.js.map