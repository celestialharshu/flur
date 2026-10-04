import { getLyrics } from '../services/lyricsService.js';

export async function fetchLyrics(req, res) {
  try {
    const { title, artist, album, duration } = req.query;
    if (!title) return res.status(400).json({ error: 'title is required.' });

    const lyrics = await getLyrics({ title, artist, album, duration });
    // lyrics === null means "none found" — that's a normal answer, not an error
    res.json({ lyrics });
  } catch (error) {
    console.error('Lyrics error:', error);
    res.status(500).json({ error: 'Failed to load lyrics.' });
  }
}
