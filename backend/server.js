// Loads .env before anything else reads process.env (imports run in order).
import 'dotenv/config';
// NOTE: Vercel's Express detection looks for an entrypoint file that imports
// express, so this import must stay even though `app` is built in src/app.js.
import express from 'express'; // eslint-disable-line no-unused-vars
import app from './src/app.js';
import pool from './src/config/db.js';

const PORT = process.env.PORT || 4000;

// Locally (node server.js): check the DB, then start listening.
// On Vercel: the platform runs `app` as a serverless function, so we must NOT
// call listen() — we just export the app below.
if (!process.env.VERCEL) {
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
}

export default app;
