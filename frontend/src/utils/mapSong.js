export function mapSong(s) {
  const total = s.duration_seconds || 0;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return {
    id: s.id,
    title: s.title,
    artist: s.artist_name,
    album: s.album_title,
    duration: `${mins}:${secs.toString().padStart(2, '0')}`,
    durationSeconds: total,
    thumbnail: s.thumbnail_url,
    streamUrl: s.stream_url,
  };
}
