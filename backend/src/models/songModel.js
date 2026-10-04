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

// Songs for "Load more": the user's preferred genres first (by their rank),
// then everything else, each ordered by popularity. Stable order so
// offset-based paging works.
export async function browseSongsForUser(userId, limit = 30, offset = 0) {
  const result = await pool.query(
    `SELECT s.*, a.name AS artist_name, al.title AS album_title
     FROM songs s
     LEFT JOIN artists a ON a.id = s.artist_id
     LEFT JOIN albums al ON al.id = s.album_id
     LEFT JOIN user_genre_preferences ugp
       ON ugp.genre_id = s.genre_id AND ugp.user_id = $1
     WHERE s.stream_url IS NOT NULL
     ORDER BY ugp.rank ASC NULLS LAST, s.play_count DESC, s.id ASC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}
