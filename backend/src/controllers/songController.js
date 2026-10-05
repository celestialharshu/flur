import { browseSongsForUser } from '../models/songModel.js';
import { discoverSongs } from '../services/discoverService.js';
import { searchJioSaavn, getPrimaryArtistName } from '../services/jiosaavnService.js';
import { persistCandidates } from '../services/catalogService.js';
import { TtlCache } from '../utils/async.js';

const searchCache = new TtlCache(200, 10 * 60 * 1000);
const running = new Map(); // query -> promise: the same search twice at once is done once

async function runSearch(key) {
  const rawSongs = await searchJioSaavn(key);

  // Persist into our DB, same as recommendations do — search results
  // become part of our growing local song catalog too.
  const saved = await persistCandidates(rawSongs.slice(0, 20));
  return saved
    .filter((x) => x.songId !== null)
    .map(({ song, songId }) => ({
      id: songId,
      title: song.title,
      artist: getPrimaryArtistName(song.artistName),
      album: song.albumTitle,
      durationSeconds: song.durationSeconds,
      thumbnail: song.thumbnailUrl,
      streamUrl: song.streamUrl,
    }));
}

export async function searchSongs(req, res) {
  try {
    const query = req.query.q;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const key = query.trim().toLowerCase();

    let songs = searchCache.get(key);
    if (!songs) {
      if (!running.has(key)) {
        running.set(key, runSearch(key).finally(() => running.delete(key)));
      }
      songs = await running.get(key);
      searchCache.set(key, songs);
    }
    res.json({ songs });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed.' });
  }
}

export async function browseSongs(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const rows = await browseSongsForUser(req.user.userId, limit + 1, offset);
    const hasMore = rows.length > limit;
    res.json({ songs: rows.slice(0, limit), hasMore });
  } catch (error) {
    console.error('Browse songs error:', error);
    res.status(500).json({ error: 'Failed to load songs.' });
  }
}

// Pulls NEW songs from JioSaavn (varied queries based on the user's genres
// and favorite artists), saves them to the DB, and returns them.
export async function discoverMoreSongs(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
    const { songs, hasMore } = await discoverSongs(req.user.userId, page);
    res.json({ songs, hasMore });
  } catch (error) {
    console.error('Discover songs error:', error);
    res.status(500).json({ error: 'Failed to discover songs.' });
  }
}
