import pool from '../config/db.js';

export async function upsertSong({
  externalId, title, artistId, albumId, genreId,
  durationSeconds, thumbnailUrl, streamUrl, playCount,
}) {
  const existing = await pool.query(
    `SELECT id FROM songs WHERE external_id = $1`,
    [externalId]
  );

  if (existing.rows.length > 0) {
    // Update play_count in case it's grown since we last saw this song
    await pool.query(
      `UPDATE songs SET play_count = $1 WHERE id = $2`,
      [playCount, existing.rows[0].id]
    );
    return existing.rows[0].id;
  }

  const result = await pool.query(
    `INSERT INTO songs (external_id, title, artist_id, album_id, genre_id, duration_seconds, thumbnail_url, stream_url, play_count, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'jiosaavn')
     RETURNING id`,
    [externalId, title, artistId, albumId, genreId, durationSeconds, thumbnailUrl, streamUrl, playCount]
  );
  return result.rows[0].id;
}

export async function getSongsByIds(ids) {
  if (ids.length === 0) return [];
  const result = await pool.query(
    `SELECT s.*, a.name AS artist_name, al.title AS album_title
     FROM songs s
     LEFT JOIN artists a ON a.id = s.artist_id
     LEFT JOIN albums al ON al.id = s.album_id
     WHERE s.id = ANY($1)`,
    [ids]
  );
  return result.rows;
}