import pool from '../config/db.js';

export async function getUserPlaylists(userId) {
  const result = await pool.query(
    `SELECT p.id, p.title, p.created_at,
            COALESCE(json_agg(
              json_build_object('songId', ps.song_id, 'thumbnail', s.thumbnail_url)
              ORDER BY ps.position, ps.id
            ) FILTER (WHERE ps.song_id IS NOT NULL), '[]') AS songs
     FROM playlists p
     LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
     LEFT JOIN songs s ON s.id = ps.song_id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.created_at ASC`,
    [userId]
  );
  return result.rows;
}

export async function createPlaylist(userId, title) {
  const result = await pool.query(
    `INSERT INTO playlists (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at`,
    [userId, title]
  );
  return result.rows[0];
}

export async function deletePlaylist(userId, playlistId) {
  await pool.query(
    `DELETE FROM playlists WHERE id = $1 AND user_id = $2`,
    [playlistId, userId]
  );
}

// The next position is worked out inside the same query (one round trip instead of two).
// Two adds at the exact same moment can get the same position; reads below break ties by id, so the order stays stable.
export async function addSongToPlaylist(playlistId, songId) {
  await pool.query(
    `INSERT INTO playlist_songs (playlist_id, song_id, position)
     SELECT $1::int, $2::int, COALESCE(MAX(position), -1) + 1
     FROM playlist_songs WHERE playlist_id = $1::int
     ON CONFLICT (playlist_id, song_id) DO NOTHING`,
    [playlistId, songId]
  );
}

export async function removeSongFromPlaylist(playlistId, songId) {
  await pool.query(
    `DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2`,
    [playlistId, songId]
  );
}

export async function getPlaylistOwner(playlistId) {
  const result = await pool.query(`SELECT user_id FROM playlists WHERE id = $1`, [playlistId]);
  return result.rows[0]?.user_id || null;
}
export async function getPlaylistById(playlistId, userId) {
  const playlistResult = await pool.query(
    `SELECT id, title, created_at FROM playlists WHERE id = $1 AND user_id = $2`,
    [playlistId, userId]
  );
  if (playlistResult.rows.length === 0) return null;

  const songsResult = await pool.query(
    `SELECT s.*, a.name AS artist_name, al.title AS album_title
     FROM playlist_songs ps
     JOIN songs s ON s.id = ps.song_id
     LEFT JOIN artists a ON a.id = s.artist_id
     LEFT JOIN albums al ON al.id = s.album_id
     WHERE ps.playlist_id = $1
     ORDER BY ps.position ASC, ps.id ASC`,
    [playlistId]
  );

  return { ...playlistResult.rows[0], songs: songsResult.rows };
}