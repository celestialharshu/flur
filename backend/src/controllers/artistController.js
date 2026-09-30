import { getAllArtists } from '../models/artistModel.js';

export async function listArtists(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const artists = await getAllArtists(limit, offset);
    res.json({ artists });
  } catch (error) {
    console.error('List artists error:', error);
    res.status(500).json({ error: 'Failed to load artists.' });
  }
}