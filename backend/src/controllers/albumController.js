import { getAllAlbums, getAlbumById, getAlbumSongs } from '../models/albumModel.js';

export async function listAlbums(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    // fetch one extra row so we can tell the client whether more exist
    const rows = await getAllAlbums(limit + 1, offset);
    const hasMore = rows.length > limit;
    res.json({ albums: rows.slice(0, limit), hasMore });
  } catch (error) {
    console.error('List albums error:', error);
    res.status(500).json({ error: 'Failed to load albums.' });
  }
}

export async function getAlbum(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid album id.' });

    const album = await getAlbumById(id);
    if (!album) return res.status(404).json({ error: 'Album not found.' });

    const songs = await getAlbumSongs(id);
    res.json({ album, songs });
  } catch (error) {
    console.error('Get album error:', error);
    res.status(500).json({ error: 'Failed to load album.' });
  }
}
