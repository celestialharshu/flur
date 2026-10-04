import pool from '../config/db.js';

// Records one play. Skips the insert if the same user/song was already logged
// in the last 10 seconds (guards against double-fires, e.g. React StrictMode).
export async function recordPlay(userId, songId) {
  const result = await pool.query(
    `INSERT INTO listen_history (user_id, song_id)
     SELECT $1, s.id FROM songs s
     WHERE s.id = $2
       AND NOT EXISTS (
         SELECT 1 FROM listen_history h
         WHERE h.user_id = $1 AND h.song_id = $2
           AND h.played_at > NOW() - INTERVAL '10 seconds'
       )
     RETURNING id`,
    [userId, songId]
  );
  return result.rows.length > 0;
}

// Most recently played DISTINCT songs, newest first.
export async function getRecentlyPlayed(userId, limit = 20) {
  const result = await pool.query(
    `SELECT s.*, a.name AS artist_name, al.title AS album_title, r.last_played
     FROM (
       SELECT song_id, MAX(played_at) AS last_played
       FROM listen_history
       WHERE user_id = $1
       GROUP BY song_id
       ORDER BY last_played DESC
       LIMIT $2
     ) r
     JOIN songs s ON s.id = r.song_id
     LEFT JOIN artists a ON a.id = s.artist_id
     LEFT JOIN albums al ON al.id = s.album_id
     ORDER BY r.last_played DESC`,
    [userId, limit]
  );
  return result.rows;
}
