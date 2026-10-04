import {
  getAllArtists, getArtistById, setArtistAvatar, getArtistSongs, getArtistAlbums,
} from '../models/artistModel.js';
import { fetchArtistImage } from '../services/artistImageService.js';
import { importSongsForArtist } from '../services/discoverService.js';

const MAX_LOOKUPS_PER_REQUEST = 20;
const MIN_SONGS_BEFORE_IMPORT = 12;
const importedArtists = new Set(); // artists we've already topped up this server run

// Look up real photos for artists that haven't been checked yet, save them,
// and patch the rows in place. Later requests are instant (photo is in the DB).
async function attachRealPhotos(artists) {
  const pending = artists.filter((a) => a.raw_avatar_url === null).slice(0, MAX_LOOKUPS_PER_REQUEST);
  await Promise.all(
    pending.map(async (artist) => {
      const url = await fetchArtistImage(artist.name);
      await setArtistAvatar(artist.id, url);
      if (url) artist.avatar_url = url;
    })
  );
}

function publicArtist(a) {
  return { id: a.id, name: a.name, avatar_url: a.avatar_url };
}

export async function listArtists(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 40, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const rows = await getAllArtists(limit + 1, offset);
    const hasMore = rows.length > limit;
    const artists = rows.slice(0, limit);

    await attachRealPhotos(artists);
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

    await attachRealPhotos([artist]);

    let songs = await getArtistSongs(id);
    // Sparse artist? Top up from JioSaavn once, so the page isn't empty.
    if (songs.length < MIN_SONGS_BEFORE_IMPORT && !importedArtists.has(id)) {
      importedArtists.add(id);
      await importSongsForArtist(artist.name);
      songs = await getArtistSongs(id);
    }

    const albums = await getArtistAlbums(id);
    res.json({ artist: publicArtist(artist), songs, albums });
  } catch (error) {
    console.error('Get artist error:', error);
    res.status(500).json({ error: 'Failed to load artist.' });
  }
}
