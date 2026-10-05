import axios from 'axios';
import { TtlCache } from '../utils/async.js';

const FLASK_BASE_URL =
  process.env.JIOSAAVN_API_URL || 'http://127.0.0.1:5100';

// Saavn's CDN serves the same files over https; an http link is blocked as
// "mixed content" by apps running on an https origin.
export function toHttps(url) {
  if (typeof url !== 'string') return url;
  return /^http:\/\/[^/]*saavncdn\.com\//i.test(url) ? `https://${url.slice(7)}` : url;
}

function mapRawSong(raw) {
  return {
    externalId: raw.id,
    title: raw.song || 'Unknown Title',
    artistName: raw.primary_artists || raw.singers || raw.music || 'Unknown Artist',
    albumTitle: raw.album || '',
    durationSeconds: parseInt(raw.duration, 10) || 0,
    thumbnailUrl: toHttps(raw.image || ''),
    streamUrl: toHttps(raw.media_url) || null,
    playCount: parseInt(raw.play_count, 10) || 0,
  };
}

// The scraper is slow, so remember answers for a while (many users search the same
// genre terms). Only real, non-empty answers are kept: a failure is never cached.
const answers = new TtlCache(300, 10 * 60 * 1000);
const running = new Map(); // same search twice at once = one call to the scraper

async function fetchSongs(query) {
  const response = await axios.get(`${FLASK_BASE_URL}/result/`, {
    params: { query },
    timeout: 15000, // 15s — don't hang forever if Flask is stuck
  });
  const rawSongs = Array.isArray(response.data) ? response.data : [];
  return rawSongs.map(mapRawSong);
}

export function searchJioSaavn(query) {
  const key = String(query).trim().toLowerCase();
  const cached = answers.get(key);
  if (cached) return Promise.resolve(cached);
  if (running.has(key)) return running.get(key);

  const p = fetchSongs(query)
    .then((songs) => {
      if (songs.length > 0) answers.set(key, songs);
      return songs;
    })
    .catch((error) => {
      // Covers: Flask returning a 500, connection refused, timeout,
      // or a malformed/truncated response — all land here safely,
      // as a normal result instead of crashing the process.
      console.error(`JioSaavn search failed for "${query}":`, error.message);
      return []; // fail gracefully — this search just contributes nothing, rest continues
    })
    .finally(() => running.delete(key));
  running.set(key, p);
  return p;
}

export function getPrimaryArtistName(fullArtistString) {
  if (!fullArtistString) return 'Unknown Artist';
  return fullArtistString.split(',')[0].trim();
}
