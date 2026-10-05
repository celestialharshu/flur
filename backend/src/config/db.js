import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Serverless: every instance has its own pool, so keep it small.
  max: process.env.VERCEL ? 5 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// An idle connection dropped by the database is not fatal: pg discards it and
// opens a new one when needed. (Exiting here would kill the whole API.)
pool.on('error', (err) => {
  console.error('Idle PostgreSQL client error:', err.message);
});

export default pool;
