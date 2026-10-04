import pool from '../config/db.js';

export async function upsertAlbum({ title, artistId, coverUrl }) {
  // No unique constraint on (title, artist_id) yet, so check manually first
  const existing = await pool.query(
    `SELECT id FROM albums WHERE title = $1 AND artist_id = $2`,
    [title, artistId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const result = await pool.query(
    `INSERT INTO albums (title, artist_id, cover_url, source)
     VALUES ($1, $2, $3, 'jiosaavn')
     RETURNING id`,
    [title, artistId, coverUrl]
  );
  return result.rows[0].id;
}
export async function getAllAlbums(limit = 50, offset = 0) {
  const result = await pool.query(
    `SELECT al.*, a.name AS artist_name
     FROM albums al
     LEFT JOIN artists a ON a.id = al.artist_id
     ORDER BY al.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

export async function getAlbumById(id) {
  const result = await pool.query(
    `SELECT al.*, a.name AS artist_name
     FROM albums al
     LEFT JOIN artists a ON a.id = al.artist_id
     WHERE al.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getAlbumSongs(albumId) {
  const result = await pool.query(
    `SELECT s.*, a.name AS artist_name, al.title AS album_title
     FROM songs s
     LEFT JOIN artists a ON a.id = s.artist_id
     LEFT JOIN albums al ON al.id = s.album_id
     WHERE s.album_id = $1
     ORDER BY s.play_count DESC, s.id ASC`,
    [albumId]
  );
  return result.rows;
}
