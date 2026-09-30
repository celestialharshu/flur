import { getUserFeed } from '../services/recommendationService.js';
import { getSongsByIds } from '../models/songModel.js';
import pool from '../config/db.js';

export async function getRecommendations(req, res) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const { songIds, albumIds, fromCache } = await getUserFeed(req.user.userId, forceRefresh);

    const songs = await getSongsByIds(songIds);
    // preserve the ranked order from scoring, since SQL's ANY() doesn't guarantee it
    const orderedSongs = songIds.map((id) => songs.find((s) => s.id === id)).filter(Boolean);

    const albumsResult = await pool.query(
      `SELECT al.*, a.name AS artist_name FROM albums al
       LEFT JOIN artists a ON a.id = al.artist_id
       WHERE al.id = ANY($1)`,
      [albumIds]
    );
    const orderedAlbums = albumIds.map((id) => albumsResult.rows.find((a) => a.id === id)).filter(Boolean);

    res.json({ songs: orderedSongs, albums: orderedAlbums, fromCache });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recommendations.' });
  }
}