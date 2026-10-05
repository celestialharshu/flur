import pool from '../config/db.js';
import { TtlCache } from '../utils/async.js';

// Albums are never deleted, so (title, artist) -> id can be remembered by this server.
const knownIds = new TtlCache(5000);
const keyOf = (title, artistId) => `${artistId}|${title}`;

export async function upsertAlbum({ title, artistId, coverUrl }) {
  const ids = await upsertAlbums([{ title, artistId, coverUrl }]);
  return ids.get(keyOf(title, artistId));
}

// Many albums in 1–2 queries. albums = [{ title, artistId, coverUrl }].
// Returns Map(`${artistId}|${title}` -> id).
// (There is no unique constraint on (title, artist_id) yet, so look first, insert what is missing.)
export async function upsertAlbums(albums) {
  const ids = new Map();
  const todo = new Map();
  for (const a of albums) {
    const key = keyOf(a.title, a.artistId);
    const id = knownIds.get(key);
    if (id !== undefined) ids.set(key, id);
    else if (!todo.has(key)) todo.set(key, a);
  }
  if (todo.size === 0) return ids;

  const list = [...todo.values()];
  const found = await pool.query(
    `SELECT al.id, al.title, al.artist_id
     FROM albums al
     JOIN unnest($1::text[], $2::int[]) AS t(title, artist_id)
       ON al.title = t.title AND al.artist_id = t.artist_id`,
    [list.map((a) => a.title), list.map((a) => a.artistId)]
  );
  for (const row of found.rows) {
    const key = keyOf(row.title, row.artist_id);
    if (!ids.has(key)) ids.set(key, row.id); // lowest id wins if duplicates already exist
  }

  const fresh = list.filter((a) => !ids.has(keyOf(a.title, a.artistId)));
  if (fresh.length > 0) {
    const inserted = await pool.query(
      `INSERT INTO albums (title, artist_id, cover_url, source)
       SELECT t.title, t.artist_id, t.cover_url, 'jiosaavn'
       FROM unnest($1::text[], $2::int[], $3::text[]) AS t(title, artist_id, cover_url)
       RETURNING id, title, artist_id`,
      [fresh.map((a) => a.title), fresh.map((a) => a.artistId), fresh.map((a) => a.coverUrl || null)]
    );
    for (const row of inserted.rows) ids.set(keyOf(row.title, row.artist_id), row.id);
  }

  for (const a of list) {
    const id = ids.get(keyOf(a.title, a.artistId));
    if (id !== undefined) knownIds.set(keyOf(a.title, a.artistId), id);
  }
  return ids;
}
export { keyOf as albumKey };

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

export async function getAlbumsByIds(ids) {
  if (ids.length === 0) return [];
  const result = await pool.query(
    `SELECT al.*, a.name AS artist_name
     FROM albums al LEFT JOIN artists a ON a.id = al.artist_id
     WHERE al.id = ANY($1::int[])
     ORDER BY array_position($1::int[], al.id)`,
    [ids]
  );
  return result.rows;
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
