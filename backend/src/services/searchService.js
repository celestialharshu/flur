import { searchJioSaavn } from './jiosaavnService.js';
import { persistResults } from './discoverService.js';
import { attachRealPhotos } from './artistImageService.js';
import { getSongsByIds } from '../models/songModel.js';
import { getAlbumsByIds } from '../models/albumModel.js';
import {
  searchSongsDb, searchAlbumsDb, searchArtistsDb, getArtistsByIds,
} from '../models/searchModel.js';
import { TtlCache } from '../utils/async.js';

const REMOTE_TIMEOUT_MS = 9000;
const REMOTE_PERSIST_LIMIT = 15;
const cache = new TtlCache(200, 10 * 60 * 1000); // normalized query -> result

// ---------- text helpers ----------
function normalize(str = '') {
  return String(str)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&quot;|&amp;|&#039;/g, ' ')
    .replace(/[^a-z0-9ऀ-ॿ਀-੿஀-௿ఀ-౿぀-ヿ가-힯一-鿿]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// "Tum Hi Ho (From "Aashiqui 2")" -> "tum hi ho"
function normalizeTitle(title = '') {
  return normalize(
    String(title)
      .replace(/\s*[(\[]\s*(from|feat|ft|with)[^)\]]*[)\]]/gi, '')
      .replace(/\s*-\s*(from)\b.*$/i, '')
  );
}

function bigrams(s) {
  const out = new Map();
  const t = ` ${s} `;
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2);
    out.set(g, (out.get(g) || 0) + 1);
  }
  return out;
}

// Dice coefficient on character bigrams: 0..1, forgiving of typos
function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a);
  const B = bigrams(b);
  let overlap = 0;
  for (const [g, n] of A) overlap += Math.min(n, B.get(g) || 0);
  const total = [...A.values()].reduce((x, y) => x + y, 0) + [...B.values()].reduce((x, y) => x + y, 0);
  return total === 0 ? 0 : (2 * overlap) / total;
}

// A token counts if it is a word, a word prefix, or (for 4+ letters) a substring —
// so "hi" matches "Hi" but not "tHInk".
function countTokens(text, tokens) {
  const words = text.split(' ');
  return tokens.filter(
    (t) => words.some((w) => w === t || w.startsWith(t)) || (t.length >= 4 && text.includes(t))
  ).length;
}

// ---------- scoring ----------
function scoreSong(song, q, tokens) {
  const title = normalizeTitle(song.title);
  const artist = normalize(song.artist_name);
  const album = normalize(song.album_title);

  let score = 0;
  if (title === q) score += 100;
  else if (title.startsWith(q)) score += 70;
  else if (title.includes(q)) score += 50;

  const inTitle = countTokens(title, tokens);
  const inArtist = countTokens(artist, tokens);
  const inAlbum = countTokens(album, tokens);
  const combined = `${title} ${artist} ${album}`;
  const covered = countTokens(combined, tokens);

  score += 15 * inTitle + 12 * inArtist + 6 * inAlbum;
  if (covered === tokens.length) score += 25; // "arijit tum hi ho" style queries

  const titleSim = similarity(q, title);
  const artistSim = similarity(q, artist);
  score += 30 * titleSim + 15 * artistSim;

  // tiny popularity tie-break (0..8)
  score += Math.min(Math.log10((Number(song.play_count) || 0) + 1), 8);

  const relevant = covered > 0 || titleSim >= 0.4 || artistSim >= 0.4;
  return relevant ? score : -1;
}

function scoreNamed(name, extra, q, tokens) {
  const n = normalize(name);
  const e = normalize(extra);
  let score = 0;
  if (n === q) score += 100;
  else if (n.startsWith(q)) score += 70;
  else if (n.includes(q)) score += 50;
  score += 15 * countTokens(n, tokens) + 5 * countTokens(e, tokens);
  const sim = similarity(q, n);
  score += 35 * sim;
  const relevant = countTokens(`${n} ${e}`, tokens) > 0 || sim >= 0.45;
  return relevant ? score : -1;
}

function withTimeout(promise, ms, fallback) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

// ---------- main ----------
export async function searchAll(rawQuery) {
  const q = normalize(rawQuery);
  if (!q) return { songs: [], albums: [], artists: [] };
  const tokens = q.split(' ').filter(Boolean).slice(0, 6);

  const hit = cache.get(q);
  if (hit) return hit;

  // 1) local DB + JioSaavn in parallel
  const [dbSongs, dbAlbums, dbArtists, remote] = await Promise.all([
    searchSongsDb(tokens).catch(() => []),
    searchAlbumsDb(tokens).catch(() => []),
    searchArtistsDb(tokens).catch(() => []),
    withTimeout(searchJioSaavn(rawQuery.trim()), REMOTE_TIMEOUT_MS, []),
  ]);

  // 2) save the best remote hits so they have real ids, then merge
  const remoteIds = [];
  await persistResults(remote.slice(0, REMOTE_PERSIST_LIMIT), null, new Set(), remoteIds);
  const remoteRows = await getSongsByIds(remoteIds);

  const songMap = new Map();
  for (const s of [...dbSongs, ...remoteRows]) songMap.set(s.id, s);

  const rankedSongs = [...songMap.values()]
    .map((s) => ({ s, score: scoreSong(s, q, tokens) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
  const songs = rankedSongs.slice(0, 20);

  // 3) albums: DB matches + albums of the best songs
  const albumMap = new Map(dbAlbums.map((a) => [a.id, a]));
  const topAlbumIds = [...new Set(songs.slice(0, 10).map((s) => s.album_id).filter(Boolean))]
    .filter((id) => !albumMap.has(id));
  const artistMap = new Map(dbArtists.map((a) => [a.id, a]));
  const topArtistIds = [...new Set(songs.slice(0, 10).map((s) => s.artist_id).filter(Boolean))]
    .filter((id) => !artistMap.has(id));
  const [topAlbums, topArtists] = await Promise.all([getAlbumsByIds(topAlbumIds), getArtistsByIds(topArtistIds)]);
  for (const a of topAlbums) albumMap.set(a.id, { ...a, fromTopSong: true });

  const albums = [...albumMap.values()]
    .map((a) => {
      let score = scoreNamed(a.title, a.artist_name, q, tokens);
      if (score < 0 && a.fromTopSong) score = 1; // keep albums of the top songs, ranked last
      return { a, score };
    })
    .filter((x) => x.score >= 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 10)
    .map((x) => x.a);

  // 4) artists: DB name matches + artists of the best songs
  for (const a of topArtists) artistMap.set(a.id, { ...a, fromTopSong: true });

  const artists = [...artistMap.values()]
    .filter((a) => a.name && a.name !== 'Unknown Artist')
    .map((a) => {
      let score = scoreNamed(a.name, '', q, tokens);
      if (score < 0 && a.fromTopSong) score = 1;
      return { a, score };
    })
    .filter((x) => x.score >= 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 8)
    .map((x) => x.a);

  // real photos for the artists we're about to show (capped, time-boxed)
  await withTimeout(attachRealPhotos(artists, 8).catch(() => {}), 3000, null);

  const value = {
    songs,
    albums: albums.map((a) => ({ id: a.id, title: a.title, artist_name: a.artist_name, cover_url: a.cover_url })),
    artists: artists.map((a) => ({ id: a.id, name: a.name, avatar_url: a.avatar_url })),
  };

  cache.set(q, value);
  return value;
}
