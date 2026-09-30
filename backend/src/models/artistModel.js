import pool from '../config/db.js';

export async function upsertArtist(name, avatarUrl = null) {
  const result = await pool.query(
    `INSERT INTO artists (name, avatar_url)
     VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name, avatarUrl]
  );
  return result.rows[0].id;
}
export async function getAllArtists(limit = 50, offset = 0) {
  const result = await pool.query(
    `SELECT a.*, 
            COALESCE(a.avatar_url, (
              SELECT s.thumbnail_url FROM songs s 
              WHERE s.artist_id = a.id AND s.thumbnail_url IS NOT NULL 
              LIMIT 1
            )) AS avatar_url
     FROM artists a
     ORDER BY a.name ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}