import { getAllAlbums } from '../models/albumModel.js';

export async function listAlbums(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const albums = await getAllAlbums(limit, offset);
    res.json({ albums });
  } catch (error) {
    console.error('List albums error:', error);
    res.status(500).json({ error: 'Failed to load albums.' });
  }
}