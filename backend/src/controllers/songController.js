import { upsertArtist } from '../models/artistModel.js';
import { upsertAlbum } from '../models/albumModel.js';
import { upsertSong, browseSongsForUser } from '../models/songModel.js';
import { discoverSongs } from '../services/discoverService.js';
import { searchJioSaavn, getPrimaryArtistName } from '../services/jiosaavnService.js';

const searchCache = new Map();
let activeRequest = null;

export async function searchSongs(req, res) {
  try {
    const query = req.query.q;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const key = query.trim().toLowerCase();

    if (searchCache.has(key)) {
      return res.json({ songs: searchCache.get(key) });
    }

    // Single-flight: never let overlapping searches pile up on the Flask scraper
    if (activeRequest) {
      await activeRequest.catch(() => {});
    }

    const requestPromise = searchJioSaavn(key);
    activeRequest = requestPromise;

    const rawSongs = await requestPromise;
    activeRequest = null;

    // Persist into our DB, same as recommendations do — search results
    // become part of our growing local song catalog too.
    const persisted = [];
    for (const song of rawSongs.slice(0, 20)) {
      const artistId = await upsertArtist(getPrimaryArtistName(song.artistName));
      const albumId = song.albumTitle
        ? await upsertAlbum({ title: song.albumTitle, artistId, coverUrl: song.thumbnailUrl })
        : null;
      const songId = await upsertSong({
        externalId: song.externalId,
        title: song.title,
        artistId,
        albumId,
        genreId: null,
        durationSeconds: song.durationSeconds,
        thumbnailUrl: song.thumbnailUrl,
        streamUrl: song.streamUrl,
        playCount: song.playCount,
      });
      persisted.push({
        id: songId,
        title: song.title,
        artist: getPrimaryArtistName(song.artistName), // was: song.artistName
        album: song.albumTitle,
        durationSeconds: song.durationSeconds,
        thumbnail: song.thumbnailUrl,
        streamUrl: song.streamUrl,
      });
    }

    searchCache.set(key, persisted);
    res.json({ songs: persisted });
  } catch (error) {
    activeRequest = null;
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed.' });
  }
}

export async function browseSongs(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
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
