import pool from '../config/db.js';
import { searchJioSaavn, getPrimaryArtistName } from './jiosaavnService.js';
import { persistCandidates } from './catalogService.js';
import { getSongsByIds } from '../models/songModel.js';
import { getUserGenrePreferences } from '../models/genreModel.js';
import { mapLimit } from '../utils/async.js';

const QUERIES_PER_PAGE = 3;
const SCRAPER_CONCURRENCY = 3; // the scraper is fragile: never hit it with many calls at once

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
  const [prefs, artists] = await Promise.all([
    getUserGenrePreferences(userId),
    getUserTopArtists(userId),
  ]);
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
  const artistQueries = artists.flatMap((name) => [
    { query: `${name} songs`, genreId: null },
    { query: `${name} hits`, genreId: null },
  ]);

  // put artist queries first — most personal — then genre variants
  return [...artistQueries, ...plan];
}

// Saves search results (skipping songs without a stream link or already seen) and
// appends their ids to songIds, in order.
export async function persistResults(results, genreId, seenKeys, songIds) {
  const fresh = [];
  for (const song of results) {
    if (!song.streamUrl) continue;
    const key = `${song.title.trim().toLowerCase()}|${getPrimaryArtistName(song.artistName).toLowerCase()}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    fresh.push(song);
  }
  for (const { songId } of await persistCandidates(fresh, genreId)) {
    if (songId !== null) songIds.push(songId);
  }
}

export async function discoverSongs(userId, page = 0) {
  const plan = await buildQueryPlan(userId);
  const start = page * QUERIES_PER_PAGE;
  const slice = plan.slice(start, start + QUERIES_PER_PAGE);
  const hasMore = start + QUERIES_PER_PAGE < plan.length;

  const seenKeys = new Set();
  const songIds = [];

  // search in parallel, save in plan order (so the first query's songs come first)
  const found = await mapLimit(slice, SCRAPER_CONCURRENCY, ({ query }) => searchJioSaavn(query)); // [] on failure
  for (let i = 0; i < slice.length; i++) {
    await persistResults(found[i], slice[i].genreId, seenKeys, songIds);
  }

  return { songs: await getSongsByIds(songIds), hasMore };
}

// Pull an artist's songs from JioSaavn into our DB (used by the artist page
// when we only know a handful of their songs).
export async function importSongsForArtist(artistName) {
  const seenKeys = new Set();
  const songIds = [];
  const queries = [artistName, `${artistName} songs`, `${artistName} hits`];
  const found = await mapLimit(queries, SCRAPER_CONCURRENCY, (q) => searchJioSaavn(q));
  for (const results of found) await persistResults(results, null, seenKeys, songIds);
  return songIds.length;
}
