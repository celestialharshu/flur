import { upsertArtist } from '../models/artistModel.js';
import { upsertAlbum } from '../models/albumModel.js';
import { upsertSong } from '../models/songModel.js';
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