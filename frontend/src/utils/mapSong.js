import { secureUrl } from './media';

export function mapSong(s) {
  const t = s.duration_seconds || 0;
  return {
    id: s.id,
    title: s.title,
    artist: s.artist_name,
    album: s.album_title,
    duration: `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`,
    durationSeconds: t,
    thumbnail: secureUrl(s.thumbnail_url),
    streamUrl: s.stream_url, // kept as the server sent it: the player upgrades it and can fall back to it
  };
}

export function mapAlbum(a) {
  return { id: a.id, title: a.title, artist: a.artist_name, coverUrl: secureUrl(a.cover_url) };
}
