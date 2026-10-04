import { recordPlay, getRecentlyPlayed } from '../models/historyModel.js';

export async function addToHistory(req, res) {
  try {
    const songId = parseInt(req.body.songId, 10);
    if (!Number.isInteger(songId)) {
      return res.status(400).json({ error: 'songId is required.' });
    }
    const recorded = await recordPlay(req.user.userId, songId);
    res.json({ recorded });
  } catch (error) {
    console.error('Record play error:', error);
    res.status(500).json({ error: 'Failed to record play.' });
  }
}

export async function listRecentlyPlayed(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const songs = await getRecentlyPlayed(req.user.userId, limit);
    res.json({ songs });
  } catch (error) {
    console.error('Recently played error:', error);
    res.status(500).json({ error: 'Failed to load recently played.' });
  }
}
