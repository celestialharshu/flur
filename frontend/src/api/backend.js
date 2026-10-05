// Falls back to localhost when the env var is missing, so a build never ends up
// calling "undefined/api". Trailing slashes are removed.
const BASE_URL = `${(import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '')}/api`;
const TIMEOUT_MS = 30000;

// --- global pending-request tracker (drives the page loader) ---
let pendingCount = 0;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());
export const subscribePending = (l) => { listeners.add(l); return () => listeners.delete(l); };
export const getPendingCount = () => pendingCount;

// GETs that are running right now (same request twice = one network call)
// and finished GETs that opted in to a short cache with `ttl`.
const live = new Map();
const done = new Map();
export function clearApiCache() { live.clear(); done.clear(); }

async function send(path, { method, body, token }) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  // No Content-Type on body-less requests: lets simple GETs skip the CORS preflight.
  if (body) headers['Content-Type'] = 'application/json';

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (err) {
    throw new Error(err.name === 'AbortError' ? 'The server took too long to answer.' : 'Could not reach the server.');
  } finally {
    clearTimeout(timer);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    // HTML/empty body instead of JSON — usually means the route doesn't exist
    // on the server (e.g. backend not redeployed with the latest code).
    throw new Error(
      response.status === 404
        ? `Server route not found (${path}). The backend may need to be redeployed.`
        : `Unexpected server response (${response.status}).`
    );
  }
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
  return data;
}

async function request(path, { method = 'GET', body, token, silent = false, ttl = 0 } = {}) {
  const isGet = method === 'GET';
  const key = isGet ? `${token || ''}|${path}` : '';

  if (ttl) {
    const hit = done.get(key);
    if (hit && Date.now() - hit.at < ttl) return hit.data;
  }

  // Only track page-data GETs (not toggles/mutations, live search typing,
  // or `silent` background requests like "Load more")
  const tracked = isGet && !silent && !path.startsWith('/songs/search');
  if (tracked) { pendingCount += 1; notify(); }
  try {
    let p = isGet ? live.get(key) : null;
    if (!p) {
      p = send(path, { method, body, token });
      if (isGet) {
        live.set(key, p);
        const free = () => live.delete(key);
        p.then(free, free);
      }
    }
    const data = await p;
    if (ttl) done.set(key, { at: Date.now(), data });
    return data;
  } finally {
    if (tracked) { pendingCount -= 1; notify(); }
  }
}

const MIN = 60 * 1000;

export const authApi = {
  signup: (name, email, password) => request('/auth/signup', { method: 'POST', body: { name, email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => request('/auth/me', { token }),
};

export const recommendationsApi = {
  get: (token, refresh = false) => request(`/recommendations${refresh ? '?refresh=true' : ''}`, { token }),
};
export const onboardingApi = {
  getGenres: () => request('/onboarding/genres', { ttl: 10 * MIN }),
  submit: (token, genreIds) => request('/onboarding/complete', { method: 'POST', body: { genreIds }, token }),
};
export const favoritesApi = {
  list: (token) => request('/favorites', { token }),
  toggle: (token, songId) => request(`/favorites/${songId}/toggle`, { method: 'POST', token }),
};

export const playlistsApi = {
  list: (token) => request('/playlists', { token }),
  get: (token, playlistId) => request(`/playlists/${playlistId}`, { token }),
  create: (token, title, songId) => request('/playlists', { method: 'POST', body: { title, songId }, token }),
  addSong: (token, playlistId, songId) => request(`/playlists/${playlistId}/songs`, { method: 'POST', body: { songId }, token }),
  removeSong: (token, playlistId, songId) => request(`/playlists/${playlistId}/songs/${songId}`, { method: 'DELETE', token }),
  remove: (token, playlistId) => request(`/playlists/${playlistId}`, { method: 'DELETE', token }),
};

export const songsApi = {
  search: (token, query) => request(`/songs/search?q=${encodeURIComponent(query)}`, { token }),
  discover: (token, page = 0) => request(`/songs/discover?page=${page}`, { token, silent: true }),
  browse: (token, offset = 0, limit = 30) => request(`/songs/browse?limit=${limit}&offset=${offset}`, { token, silent: true }),
};

// First pages of the big lists are cached for a minute, so hopping between
// pages doesn't re-query the server every time.
export const albumsApi = {
  list: (token, offset = 0, limit = 30) =>
    request(`/albums?limit=${limit}&offset=${offset}`, { token, silent: offset > 0, ttl: offset === 0 ? MIN : 0 }),
  get: (token, albumId) => request(`/albums/${albumId}`, { token, ttl: MIN }),
};

export const artistsApi = {
  list: (token, offset = 0, limit = 40) =>
    request(`/artists?limit=${limit}&offset=${offset}`, { token, silent: offset > 0, ttl: offset === 0 ? MIN : 0 }),
  get: (token, artistId) => request(`/artists/${artistId}`, { token, ttl: MIN }),
};

export const historyApi = {
  record: (token, songId) => request('/history', { method: 'POST', body: { songId }, token }),
  recent: (token, limit = 20) => request(`/history/recent?limit=${limit}`, { token }),
};

export const lyricsApi = {
  get: (token, { title, artist, album, duration }) => {
    const params = new URLSearchParams({
      title: title || '',
      artist: artist || '',
      album: album || '',
      duration: duration || '',
    });
    return request(`/lyrics?${params.toString()}`, { token, silent: true });
  },
};

export const searchApi = {
  // silent: the search page shows its own loader (and typing must not flash the global one)
  all: (token, query) => request(`/search?q=${encodeURIComponent(query)}`, { token, silent: true, ttl: 5 * MIN }),
};
