import axios from 'axios';

const FLASK_BASE_URL =
  process.env.JIOSAAVN_API_URL || 'http://127.0.0.1:5100';

function mapRawSong(raw) {
  return {
    externalId: raw.id,
    title: raw.song || 'Unknown Title',
    artistName: raw.primary_artists || raw.singers || raw.music || 'Unknown Artist',
    albumTitle: raw.album || '',
    durationSeconds: parseInt(raw.duration, 10) || 0,
    thumbnailUrl: raw.image || '',
    streamUrl: raw.media_url || null,
    playCount: parseInt(raw.play_count, 10) || 0,
  };
}

export async function searchJioSaavn(query) {
  try {
    const response = await axios.get(`${FLASK_BASE_URL}/result/`, {
      params: { query },
      timeout: 15000, // 15s — don't hang forever if Flask is stuck
    });

    const rawSongs = Array.isArray(response.data) ? response.data : [];
    return rawSongs.map(mapRawSong);
  } catch (error) {
    // Covers: Flask returning a 500, connection refused, timeout,
    // or a malformed/truncated response — all land here safely now,
    // as a normal rejected promise instead of crashing the process.
    console.error(`JioSaavn search failed for "${query}":`, error.message);
    return []; // fail gracefully — this genre's search just contributes nothing, rest continues
  }
}
export function getPrimaryArtistName(fullArtistString) {
  if (!fullArtistString) return 'Unknown Artist';
  return fullArtistString.split(',')[0].trim();
}