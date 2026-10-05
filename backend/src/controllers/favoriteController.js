import { getFavoriteSongs, toggleFavoriteRow } from '../models/favoriteModel.js';

export async function listFavorites(req, res) {
  try {
    const songs = await getFavoriteSongs(req.user.userId);
    res.json({ songs });
  } catch (error) {
    console.error('List favorites error:', error);
    res.status(500).json({ error: 'Failed to load favorites.' });
  }
}

export async function toggleFavorite(req, res) {
  try {
    const songId = parseInt(req.params.songId, 10);
    if (!Number.isInteger(songId)) return res.status(400).json({ error: 'Invalid song id.' });

    res.json({ isFavorite: await toggleFavoriteRow(req.user.userId, songId) });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to update favorite.' });
  }
}
