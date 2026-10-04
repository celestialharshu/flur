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

// avatar_url semantics:
//   NULL  -> we haven't looked up a real photo yet
//   ''    -> we looked and none was found (don't retry)
//   url   -> real artist photo
// The API returns `avatar_url` = real photo, else cover art of one of their songs.
export const ARTIST_SELECT = `
  a.id,
  a.name,
  a.avatar_url AS raw_avatar_url,
  COALESCE(NULLIF(a.avatar_url, ''), (
    SELECT s.thumbnail_url FROM songs s
    WHERE s.artist_id = a.id AND s.thumbnail_url IS NOT NULL
    LIMIT 1
  )) AS avatar_url
`;

export async function getAllArtists(limit = 50, offset = 0) {
  const result = await pool.query(
    `SELECT ${ARTIST_SELECT}
     FROM artists a
     ORDER BY a.name ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

export async function getArtistById(id) {
  const result = await pool.query(
    `SELECT ${ARTIST_SELECT} FROM artists a WHERE a.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function setArtistAvatar(id, url) {
  // '' marks "looked up, nothing found"
  await pool.query(`UPDATE artists SET avatar_url = $1 WHERE id = $2`, [url || '', id]);
}

export async function getArtistSongs(artistId, limit = 100) {
  const result = await pool.query(
    `SELECT s.*, a.name AS artist_name, al.title AS album_title
     FROM songs s
     LEFT JOIN artists a ON a.id = s.artist_id
     LEFT JOIN albums al ON al.id = s.album_id
     WHERE s.artist_id = $1
     ORDER BY s.play_count DESC, s.id ASC
     LIMIT $2`,
    [artistId, limit]
  );
  return result.rows;
}

export async function getArtistAlbums(artistId) {
  const result = await pool.query(
    `SELECT al.*, a.name AS artist_name
     FROM albums al
     LEFT JOIN artists a ON a.id = al.artist_id
     WHERE al.artist_id = $1
     ORDER BY al.created_at DESC`,
    [artistId]
  );
  return result.rows;
}
