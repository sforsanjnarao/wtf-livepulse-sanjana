"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});
exports.default = pool;
//# sourceMappingURL=pool.js.map