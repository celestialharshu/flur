import pool from '../config/db.js';

export async function getFavoriteSongIds(userId) {
  const result = await pool.query(
    `SELECT song_id FROM favorites WHERE user_id = $1 ORDER BY favorited_at DESC`,
    [userId]
  );
  return result.rows.map((r) => r.song_id);
}

export async function getFavoriteSongs(userId) {
  const result = await pool.query(
    `SELECT s.*, a.name AS artist_name, al.title AS album_title
     FROM favorites f
     JOIN songs s ON s.id = f.song_id
     LEFT JOIN artists a ON a.id = s.artist_id
     LEFT JOIN albums al ON al.id = s.album_id
     WHERE f.user_id = $1
     ORDER BY f.favorited_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function addFavorite(userId, songId) {
  await pool.query(
    `INSERT INTO favorites (user_id, song_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, song_id) DO NOTHING`,
    [userId, songId]
  );
}

export async function removeFavorite(userId, songId) {
  await pool.query(
    `DELETE FROM favorites WHERE user_id = $1 AND song_id = $2`,
    [userId, songId]
  );
}

export async function isFavorite(userId, songId) {
  const result = await pool.query(
    `SELECT 1 FROM favorites WHERE user_id = $1 AND song_id = $2`,
    [userId, songId]
  );
  return result.rows.length > 0;
}

// Flips the heart in ONE query: removes the favorite if it exists, otherwise adds it.
// Returns the new state (true = now a favorite).
export async function toggleFavoriteRow(userId, songId) {
  const result = await pool.query(
    `WITH removed AS (
       DELETE FROM favorites WHERE user_id = $1 AND song_id = $2 RETURNING 1
     ), added AS (
       INSERT INTO favorites (user_id, song_id)
       SELECT $1::int, $2::int WHERE NOT EXISTS (SELECT 1 FROM removed)
       ON CONFLICT (user_id, song_id) DO NOTHING
       RETURNING 1
     )
     SELECT EXISTS (SELECT 1 FROM added) AS is_favorite`,
    [userId, songId]
  );
  return result.rows[0].is_favorite;
}
