import pool from '../config/db.js';
import { searchJioSaavn, getPrimaryArtistName } from './jiosaavnService.js';
import { upsertArtist } from '../models/artistModel.js';
import { upsertAlbum } from '../models/albumModel.js';
import { upsertSong, getSongsByIds } from '../models/songModel.js';
import { getUserGenrePreferences } from '../models/genreModel.js';

const QUERIES_PER_PAGE = 3;

// Added to each genre search term to reach songs the base feed never saw.
// (The unmodified terms are already used by the recommendation feed.)
const MODIFIERS = [
  'latest', 'new', 'top 50', 'best of', 'classics', 'evergreen',
  '2025', '2024', '2023', '2022', 'superhit', 'trending', 'old is gold',
];

async function getUserTopArtists(userId, limit = 8) {
  const result = await pool.query(
    `SELECT a.name, COUNT(*) AS plays
     FROM (
       SELECT song_id FROM listen_history WHERE user_id = $1
       UNION ALL
       SELECT song_id FROM favorites WHERE user_id = $1
     ) x
     JOIN songs s ON s.id = x.song_id
     JOIN artists a ON a.id = s.artist_id
     WHERE a.name <> 'Unknown Artist'
     GROUP BY a.name
     ORDER BY plays DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows.map((r) => r.name);
}

// Deterministic, ordered list of search queries for this user. "page" N simply
// takes the next slice, so every Load more click uses fresh queries.
async function buildQueryPlan(userId) {
  const prefs = await getUserGenrePreferences(userId);
  const plan = [];

  // genre x modifier, interleaved across genres so variety stays high
  for (const modifier of MODIFIERS) {
    for (const genre of prefs) {
      for (const term of genre.search_terms.slice(0, 2)) {
        plan.push({ query: `${term} ${modifier}`, genreId: genre.id });
      }
    }
  }

  // songs by artists the user actually listens to / favorites
  const artists = await getUserTopArtists(userId);
  const artistQueries = artists.flatMap((name) => [
    { query: `${name} songs`, genreId: null },
    { query: `${name} hits`, genreId: null },
  ]);

  // put artist queries first — most personal — then genre variants
  return [...artistQueries, ...plan];
}

export async function discoverSongs(userId, page = 0) {
  const plan = await buildQueryPlan(userId);
  const start = page * QUERIES_PER_PAGE;
  const slice = plan.slice(start, start + QUERIES_PER_PAGE);
  const hasMore = start + QUERIES_PER_PAGE < plan.length;

  const seenKeys = new Set();
  const songIds = [];

  for (const { query, genreId } of slice) {
    const results = await searchJioSaavn(query); // returns [] on failure
    for (const song of results) {
      if (!song.streamUrl) continue;
      const key = `${song.title.trim().toLowerCase()}|${getPrimaryArtistName(song.artistName).toLowerCase()}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const artistId = await upsertArtist(getPrimaryArtistName(song.artistName));
      const albumId = song.albumTitle
        ? await upsertAlbum({ title: song.albumTitle, artistId, coverUrl: song.thumbnailUrl })
        : null;
      const id = await upsertSong({
        externalId: song.externalId,
        title: song.title,
        artistId,
        albumId,
        genreId,
        durationSeconds: song.durationSeconds,
        thumbnailUrl: song.thumbnailUrl,
        streamUrl: song.streamUrl,
        playCount: song.playCount,
      });
      songIds.push(id);
    }
  }

  const rows = await getSongsByIds(songIds);
  const ordered = songIds.map((id) => rows.find((r) => r.id === id)).filter(Boolean);
  return { songs: ordered, hasMore };
}
