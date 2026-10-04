import axios from 'axios';

const LRCLIB = 'https://lrclib.net/api';
const HEADERS = { 'User-Agent': 'Flur Music Player (personal project)' };

// song key -> result (also caches "not found" so we don't re-query LRCLIB)
const cache = new Map();

function decodeEntities(str = '') {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// JioSaavn titles look like: Tum Hi Ho (From "Aashiqui 2") / Song - From "Movie"
function cleanTitle(title = '') {
  return decodeEntities(title)
    .replace(/\s*[(\[]\s*(from|feat|ft|with|remix|lofi|lo-fi|reprise|unplugged|version)[^)\]]*[)\]]/gi, '')
    .replace(/\s*-\s*(from|feat|ft)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function primaryArtist(artist = '') {
  return decodeEntities(artist).split(/,|&| feat\.?| ft\.?/i)[0].trim();
}

// "[01:23.45] some text" (a line may carry several timestamps)
function parseLrc(lrc) {
  const lines = [];
  for (const raw of lrc.split('\n')) {
    const stamps = [...raw.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    if (stamps.length === 0) continue;
    const text = raw.replace(/\[[^\]]*\]/g, '').trim();
    for (const m of stamps) {
      const frac = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) / 1000 : 0;
      lines.push({ time: parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + frac, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

function shape(record) {
  if (!record) return null;
  if (record.instrumental) return { instrumental: true, synced: null, plain: null };
  const synced = record.syncedLyrics ? parseLrc(record.syncedLyrics) : null;
  const plain = record.plainLyrics || null;
  if (!(synced && synced.length) && !plain) return null;
  return { instrumental: false, synced: synced && synced.length ? synced : null, plain };
}

async function tryGet(params) {
  try {
    const { data } = await axios.get(`${LRCLIB}/get`, { params, headers: HEADERS, timeout: 8000 });
    return data;
  } catch {
    return null; // 404 = not found; network errors also just mean "no lyrics"
  }
}

async function trySearch(params, duration) {
  try {
    const { data } = await axios.get(`${LRCLIB}/search`, { params, headers: HEADERS, timeout: 8000 });
    if (!Array.isArray(data) || data.length === 0) return null;
    const usable = data.filter((r) => r.syncedLyrics || r.plainLyrics || r.instrumental);
    if (usable.length === 0) return null;
    // prefer synced lyrics, then the closest duration
    usable.sort((a, b) => {
      const sa = a.syncedLyrics ? 0 : 1;
      const sb = b.syncedLyrics ? 0 : 1;
      if (sa !== sb) return sa - sb;
      if (!duration) return 0;
      return Math.abs((a.duration || 0) - duration) - Math.abs((b.duration || 0) - duration);
    });
    return usable[0];
  } catch {
    return null;
  }
}

export async function getLyrics({ title, artist, album, duration }) {
  const track = cleanTitle(title);
  const art = primaryArtist(artist);
  const dur = Math.round(Number(duration)) || undefined;
  const key = `${track}|${art}`.toLowerCase();

  if (cache.has(key)) return cache.get(key);

  let record =
    (await tryGet({ track_name: track, artist_name: art, album_name: decodeEntities(album || ''), duration: dur })) ||
    (await tryGet({ track_name: track, artist_name: art })) ||
    (await trySearch({ track_name: track, artist_name: art }, dur)) ||
    (await trySearch({ q: `${track} ${art}` }, dur));

  const result = shape(record);
  cache.set(key, result);
  return result;
}
