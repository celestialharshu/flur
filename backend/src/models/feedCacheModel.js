import pool from '../config/db.js';

export async function getFeedCache(userId) {
  const result = await pool.query(
    `SELECT song_ids, album_ids, generated_at FROM user_feed_cache WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function saveFeedCache(userId, songIds, albumIds) {
  await pool.query(
    `INSERT INTO user_feed_cache (user_id, song_ids, album_ids, generated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) DO UPDATE
     SET song_ids = EXCLUDED.song_ids, album_ids = EXCLUDED.album_ids, generated_at = NOW()`,
    [userId, songIds, albumIds]
  );
}