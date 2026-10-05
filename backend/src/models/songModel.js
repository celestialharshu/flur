import pool from '../config/db.js';

// Many songs in 2–3 queries (instead of 2 per song). songs = [{ externalId, title, artistId,
// albumId, genreId, durationSeconds, thumbnailUrl, streamUrl, playCount }].
// Returns Map(externalId -> song id). Songs already saved keep their row; their play count
// (and stream link, if the new one is different) is refreshed.
export async function upsertSongs(songs) {
  const byExternal = new Map();
  const noExternal = [];
  for (const s of songs) {
    if (s.externalId) {
      if (!byExternal.has(s.externalId)) byExternal.set(s.externalId, s);
    } else {
      noExternal.push(s);
    }
  }
  const ids = new Map();

  if (byExternal.size > 0) {
    const externalIds = [...byExternal.keys()];
    const existing = await pool.query(
      `SELECT id, external_id, play_count, stream_url FROM songs WHERE external_id = ANY($1::text[]) ORDER BY id`,
      [externalIds]
    );

    const stale = [];
    for (const row of existing.rows) {
      if (ids.has(row.external_id)) continue; // duplicates already in the table: first one wins
      ids.set(row.external_id, row.id);
      const s = byExternal.get(row.external_id);
      const newCount = Number(s.playCount) || 0;
      const newUrl = s.streamUrl || null;
      if (Number(row.play_count) !== newCount || (newUrl && newUrl !== row.stream_url)) {
        stale.push({ id: row.id, playCount: newCount, streamUrl: newUrl });
      }
    }
    if (stale.length > 0) {
      await pool.query(
        `UPDATE songs s
         SET play_count = v.play_count, stream_url = COALESCE(v.stream_url, s.stream_url)
         FROM unnest($1::int[], $2::bigint[], $3::text[]) AS v(id, play_count, stream_url)
         WHERE s.id = v.id`,
        [stale.map((x) => x.id), stale.map((x) => x.playCount), stale.map((x) => x.streamUrl)]
      );
    }
  }

  const fresh = [...byExternal.values()].filter((s) => !ids.has(s.externalId)).concat(noExternal);
  if (fresh.length > 0) {
    const inserted = await pool.query(
      `INSERT INTO songs (external_id, title, artist_id, album_id, genre_id, duration_seconds, thumbnail_url, stream_url, play_count, source)
       SELECT t.external_id, t.title, t.artist_id, t.album_id, t.genre_id, t.duration_seconds, t.thumbnail_url, t.stream_url, t.play_count, 'jiosaavn'
       FROM unnest($1::text[], $2::text[], $3::int[], $4::int[], $5::int[], $6::int[], $7::text[], $8::text[], $9::bigint[])
            AS t(external_id, title, artist_id, album_id, genre_id, duration_seconds, thumbnail_url, stream_url, play_count)
       RETURNING id, external_id`,
      [
        fresh.map((s) => s.externalId || null),
        fresh.map((s) => s.title),
        fresh.map((s) => s.artistId ?? null),
        fresh.map((s) => s.albumId ?? null),
        fresh.map((s) => s.genreId ?? null),
        fresh.map((s) => s.durationSeconds || 0),
        fresh.map((s) => s.thumbnailUrl || null),
        fresh.map((s) => s.streamUrl || null),
        fresh.map((s) => Number(s.playCount) || 0),
      ]
    );
    for (const row of inserted.rows) {
      if (row.external_id) ids.set(row.external_id, row.id);
    }
  }
  return ids;
}

export async function upsertSong(song) {
  const ids = await upsertSongs([song]);
  return ids.get(song.externalId) ?? null;
}

// Songs in the order of `ids`.
export async function getSongsByIds(ids) {
  if (ids.length === 0) return [];
  const result = await pool.query(
    `SELECT s.*, a.name AS artist_name, al.title AS album_title
     FROM songs s
     LEFT JOIN artists a ON a.id = s.artist_id
     LEFT JOIN albums al ON al.id = s.album_id
     WHERE s.id = ANY($1::int[])
     ORDER BY array_position($1::int[], s.id)`,
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
