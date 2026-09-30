import app from './src/app.js';
import pool from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

// Quick sanity check on startup — confirms the DB is actually reachable
// before the server starts accepting requests, so failures show up
// immediately in the terminal instead of surfacing later as a mystery 500 error.
pool.query('SELECT NOW()')
  .then((result) => {
    console.log('✅ Connected to PostgreSQL:', result.rows[0].now);
    app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
  })
  .catch((err) => {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  });