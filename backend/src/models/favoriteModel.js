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