import { getFavoriteSongs, addFavorite, removeFavorite, isFavorite } from '../models/favoriteModel.js';

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
    const alreadyFavorited = await isFavorite(req.user.userId, songId);

    if (alreadyFavorited) {
      await removeFavorite(req.user.userId, songId);
      res.json({ isFavorite: false });
    } else {
      await addFavorite(req.user.userId, songId);
      res.json({ isFavorite: true });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to update favorite.' });
  }
}