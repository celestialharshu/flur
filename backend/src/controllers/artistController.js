import {
  getAllArtists, getArtistById, getArtistSongs, getArtistAlbums,
} from '../models/artistModel.js';
import { attachRealPhotos } from '../services/artistImageService.js';
import { importSongsForArtist } from '../services/discoverService.js';

const MIN_SONGS_BEFORE_IMPORT = 12;
const PHOTO_WAIT_MS = 3500; // photo lookups must never hold the page up for long
const importedArtists = new Set(); // artists we've already topped up this server run

function publicArtist(a) {
  return { id: a.id, name: a.name, avatar_url: a.avatar_url };
}

// Waits for the photo lookups, but gives up after a few seconds (they keep going and
// are saved for next time; a failed lookup is just "no photo yet").
function withPhotos(artists) {
  const lookup = attachRealPhotos(artists).catch(() => {});
  const timeout = new Promise((resolve) => setTimeout(resolve, PHOTO_WAIT_MS));
  return Promise.race([lookup, timeout]);
}

export async function listArtists(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 40, 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const rows = await getAllArtists(limit + 1, offset);
    const hasMore = rows.length > limit;
    const artists = rows.slice(0, limit);

    await withPhotos(artists);
    res.json({ artists: artists.map(publicArtist), hasMore });
  } catch (error) {
    console.error('List artists error:', error);
    res.status(500).json({ error: 'Failed to load artists.' });
  }
}

export async function getArtist(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid artist id.' });

    const artist = await getArtistById(id);
    if (!artist) return res.status(404).json({ error: 'Artist not found.' });

    // the photo lookup, the songs and the albums don't depend on each other
    const [songs, albums] = await Promise.all([
      getArtistSongs(id),
      getArtistAlbums(id),
      withPhotos([artist]),
    ]);

    // Sparse artist? Top up from JioSaavn once, so the page isn't empty.
    if (songs.length < MIN_SONGS_BEFORE_IMPORT && !importedArtists.has(id)) {
      importedArtists.add(id);
      await importSongsForArtist(artist.name);
      return res.json({
        artist: publicArtist(artist),
        songs: await getArtistSongs(id),
        albums: await getArtistAlbums(id),
      });
    }

    res.json({ artist: publicArtist(artist), songs, albums });
  } catch (error) {
    console.error('Get artist error:', error);
    res.status(500).json({ error: 'Failed to load artist.' });
  }
}
