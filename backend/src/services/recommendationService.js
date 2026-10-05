import { searchJioSaavn, getPrimaryArtistName } from './jiosaavnService.js';
import { persistCandidates } from './catalogService.js';
import { getUserGenrePreferences } from '../models/genreModel.js';
import { getFeedCache, saveFeedCache } from '../models/feedCacheModel.js';
import { mapLimit } from '../utils/async.js';

const RANK_WEIGHTS = { 1: 1.0, 2: 0.85, 3: 0.7, 4: 0.55, 5: 0.4 };
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SCRAPER_CONCURRENCY = 3; // the scraper is fragile: never hit it with many calls at once

function normalizeKey(title, artistName) {
  return `${title.trim().toLowerCase()}|${getPrimaryArtistName(artistName).trim().toLowerCase()}`;
}

// Keeps one version of each real song (the same track often appears on several
// compilations): prefer the one with an album, then the most played.
function dedupeCandidates(allCandidates) {
  // Dedup layer 1: within this genre's own results, the same real song
  // often appears multiple times (different album compilations on JioSaavn
  // carrying the identical track). Collapse those BEFORE persisting/scoring,
  // keeping whichever version has an album attached and the highest play count.
  const deduped = new Map();
  for (const song of allCandidates) {
    const key = normalizeKey(song.title, song.artistName);
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, song);
      continue;
    }

    const existingHasAlbum = Boolean(existing.albumTitle);
    const currentHasAlbum = Boolean(song.albumTitle);
    const currentIsBetter =
      (currentHasAlbum && !existingHasAlbum) ||
      (currentHasAlbum === existingHasAlbum && song.playCount > existing.playCount);

    if (currentIsBetter) {
      deduped.set(key, song);
    }
  }
  return deduped;
}

async function persistGenre(genre, allCandidates) {
  const deduped = dedupeCandidates(allCandidates);
  const keys = [...deduped.keys()];
  const saved = await persistCandidates([...deduped.values()], genre.id);

  const persisted = [];
  saved.forEach(({ song, songId, albumId }, i) => {
    if (songId === null) return;
    persisted.push({
      songId,
      albumId,
      playCount: song.playCount,
      genreRank: genre.rank,
      dedupeKey: keys[i],
    });
  });
  return persisted;
}

function scoreEntries(allEntries) {
  // Dedup layer 2: across genres, group by the SAME title+artist key —
  // but this time we WANT to sum scores across genres, since a song
  // matching multiple of the user's picked genres is a genuinely
  // stronger signal, not a duplicate to collapse away.
  const byKey = new Map(); // dedupeKey -> { score, songId, albumId }

  for (const entry of allEntries) {
    const weight = RANK_WEIGHTS[entry.genreRank] || 0.3;
    const score = weight * Math.log((entry.playCount || 0) + 1);

    const existing = byKey.get(entry.dedupeKey);
    if (existing) {
      existing.score += score;
      // Prefer keeping whichever songId has an album attached
      if (!existing.albumId && entry.albumId) {
        existing.songId = entry.songId;
        existing.albumId = entry.albumId;
      }
    } else {
      byKey.set(entry.dedupeKey, { score, songId: entry.songId, albumId: entry.albumId });
    }
  }

  // Return keyed by songId (the canonical one we settled on per unique song)
  const scored = new Map();
  for (const { score, songId, albumId } of byKey.values()) {
    scored.set(songId, { score, albumId });
  }
  return scored;
}

function rankAlbums(scoredSongs) {
  const albumScores = new Map();
  for (const [, { score, albumId }] of scoredSongs) {
    if (!albumId) continue;
    albumScores.set(albumId, (albumScores.get(albumId) || 0) + score);
  }
  return Array.from(albumScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([albumId]) => albumId);
}

export async function generateFeedForUser(userId) {
  const preferences = await getUserGenrePreferences(userId);
  if (preferences.length === 0) {
    throw new Error('User has not completed onboarding — no genre preferences found.');
  }

  // Ask the scraper for every search term (a few at a time), then save each genre's songs.
  const tasks = preferences.flatMap((genre) => genre.search_terms.map((term) => ({ genre, term })));
  const found = await mapLimit(tasks, SCRAPER_CONCURRENCY, ({ term }) => searchJioSaavn(term)); // [] on failure

  const perGenre = preferences.map(() => []);
  tasks.forEach(({ genre }, i) => perGenre[preferences.indexOf(genre)].push(...found[i]));

  // One genre after the other: the same song can appear in two genres, and saving
  // them at the same time could create it twice.
  const allEntries = [];
  for (let i = 0; i < preferences.length; i++) {
    allEntries.push(...(await persistGenre(preferences[i], perGenre[i])));
  }

  const scoredSongs = scoreEntries(allEntries);
  const allSorted = Array.from(scoredSongs.entries()).sort((a, b) => b[1].score - a[1].score);

  // Take a wider pool (top 100 by score, or however many exist) then
  // weighted-sample 50 from it — mostly the best songs, with real variety.
  const candidatePool = allSorted.slice(0, 100);
  const sampledSongs = weightedSample(candidatePool, Math.min(50, candidatePool.length));
  const topSongIds = sampledSongs.map(([songId]) => songId);

  const sampledMap = new Map(sampledSongs);
  const topAlbumIds = rankAlbums(sampledMap).slice(0, 20);

  await saveFeedCache(userId, topSongIds, topAlbumIds);
  return { songIds: topSongIds, albumIds: topAlbumIds };
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function getUserFeed(userId, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await getFeedCache(userId);
    if (cached) {
      const age = Date.now() - new Date(cached.generated_at).getTime();
      if (age < CACHE_TTL_MS) {
        return {
          songIds: shuffleArray(cached.song_ids),
          albumIds: shuffleArray(cached.album_ids),
          fromCache: true,
        };
      }
    }
  }

  const fresh = await generateFeedForUser(userId);
  return {
    songIds: shuffleArray(fresh.songIds),
    albumIds: shuffleArray(fresh.albumIds),
    fromCache: false,
  };
}
// Instead of always taking the literal top N by score, sample using
// score-weighted randomness from a wider pool — higher-scored songs are
// still much more likely to appear, but the exact set varies run to run.
function weightedSample(scoredEntries, count) {
  const pool = [...scoredEntries]; // [ [songId, {score, albumId}], ... ]
  const picked = [];

  while (picked.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, [, v]) => sum + v.score, 0);
    let rand = Math.random() * totalWeight;
    let index = 0;

    for (let i = 0; i < pool.length; i++) {
      rand -= pool[i][1].score;
      if (rand <= 0) {
        index = i;
        break;
      }
    }

    picked.push(pool[index]);
    pool.splice(index, 1);
  }

  return picked;
}