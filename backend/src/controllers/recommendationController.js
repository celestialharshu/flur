import { getUserFeed } from '../services/recommendationService.js';
import { getSongsByIds } from '../models/songModel.js';
import { getAlbumsByIds } from '../models/albumModel.js';

export async function getRecommendations(req, res) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const { songIds, albumIds, fromCache } = await getUserFeed(req.user.userId, forceRefresh);

    // both come back in the ranked order of the ids (the feed's order)
    const [songs, albums] = await Promise.all([getSongsByIds(songIds), getAlbumsByIds(albumIds)]);

    res.json({ songs, albums, fromCache });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recommendations.' });
  }
}
