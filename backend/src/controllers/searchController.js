import { searchAll } from '../services/searchService.js';

export async function search(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'Search query is required.' });
    res.json(await searchAll(q));
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed.' });
  }
}
