import { getAllGenres, saveUserGenrePreferences, getUserGenrePreferences } from '../models/genreModel.js';

export async function listGenres(req, res) {
  try {
    const genres = await getAllGenres();
    res.json({ genres });
  } catch (error) {
    console.error('List genres error:', error);
    res.status(500).json({ error: 'Failed to load genres.' });
  }
}

export async function submitOnboarding(req, res) {
  try {
    const { genreIds } = req.body;

    if (!Array.isArray(genreIds) || genreIds.length !== 5) {
      return res.status(400).json({ error: 'Exactly 5 genre ids are required.' });
    }

    const uniqueIds = new Set(genreIds);
    if (uniqueIds.size !== 5) {
      return res.status(400).json({ error: 'Genre selections must be unique.' });
    }

    await saveUserGenrePreferences(req.user.userId, genreIds);
    const preferences = await getUserGenrePreferences(req.user.userId);

    res.json({ preferences });
  } catch (error) {
    console.error('Submit onboarding error:', error);
    res.status(500).json({ error: 'Failed to save preferences.' });
  }
}