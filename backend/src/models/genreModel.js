import pool from '../config/db.js';

export async function getAllGenres() {
  const result = await pool.query(
    `SELECT id, name FROM genres ORDER BY name ASC`
  );
  return result.rows;
}

export async function saveUserGenrePreferences(userId, genreIds) {
  // genreIds is an ordered array — index 0 = rank 1 (top pick), index 4 = rank 5
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear any existing preferences first (in case user redoes onboarding)
    await client.query(
      `DELETE FROM user_genre_preferences WHERE user_id = $1`,
      [userId]
    );

    for (let i = 0; i < genreIds.length; i++) {
      await client.query(
        `INSERT INTO user_genre_preferences (user_id, genre_id, rank)
         VALUES ($1, $2, $3)`,
        [userId, genreIds[i], i + 1]
      );
    }

    await client.query(
      `UPDATE users SET has_completed_onboarding = TRUE WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserGenrePreferences(userId) {
  const result = await pool.query(
    `SELECT g.id, g.name, g.search_terms, ugp.rank
     FROM user_genre_preferences ugp
     JOIN genres g ON g.id = ugp.genre_id
     WHERE ugp.user_id = $1
     ORDER BY ugp.rank ASC`,
    [userId]
  );
  return result.rows;
}