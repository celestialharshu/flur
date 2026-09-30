import pool from '../config/db.js';

export async function createUser({ name, email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, role, avatar_url, has_completed_onboarding, created_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await pool.query(
    `SELECT id, name, email, role, avatar_url, has_completed_onboarding, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function markOnboardingComplete(userId) {
  await pool.query(
    `UPDATE users SET has_completed_onboarding = TRUE WHERE id = $1`,
    [userId]
  );
}