import { useState, useEffect, useMemo } from 'react';
import { Play, Shuffle } from 'lucide-react';
import SongList from '../components/Songs/SongList';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { albumsApi } from '../api/backend';
import { mapSong } from '../utils/mapSong';
import { secureUrl } from '../utils/media';
import { shuffled } from '../utils/shuffle';

function AlbumDetail({ albumId, onBack }) {
  const { token } = useAuth();
  const { playTrack } = usePlayer();

  const [album, setAlbum] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !albumId) return;
    setIsLoading(true);
    setError(null);
    albumsApi.get(token, albumId)
      .then(({ album, songs }) => {
        setAlbum(album);
        setSongs(songs.map(mapSong));
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token, albumId]);

  const totalMinutes = useMemo(
    () => Math.round(songs.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60),
    [songs]
  );

  if (isLoading) return null; // the global loader is showing

  if (error || !album) {
    return (
      <div className="album-detail">
        <button className="playlist-detail__back" onClick={onBack}>← Back to Albums</button>
        <p className="text-secondary">{error || 'Album not found.'}</p>
      </div>
    );
  }

  const handleShuffle = () => {
    if (songs.length === 0) return;
    const list = shuffled(songs);
    playTrack(list[0], list);
  };

  return (
    <div className="album-detail">
      <button className="playlist-detail__back" onClick={onBack}>← Back to Albums</button>

      <div className="album-detail__hero">
        <img src={secureUrl(album.cover_url)} alt={album.title} className="album-detail__cover" />
        <div className="album-detail__meta">
          <span className="text-muted">ALBUM</span>
          <h1 className="album-detail__title">{album.title}</h1>
          <span className="text-secondary">
            {album.artist_name || 'Unknown artist'} · {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            {totalMinutes > 0 ? ` · ${totalMinutes} min` : ''}
          </span>
          {songs.length > 0 && (
            <div className="explorer-hero__actions album-detail__actions">
              <button className="explorer-hero__btn explorer-hero__btn--primary" onClick={() => playTrack(songs[0], songs)}>
                <Play size={16} fill="currentColor" /> Play
              </button>
              <button className="explorer-hero__btn" onClick={handleShuffle}>
                <Shuffle size={16} /> Shuffle
              </button>
            </div>
          )}
        </div>
      </div>

      {songs.length === 0 ? (
        <p className="text-secondary">No songs from this album in your library yet.</p>
      ) : (
        <>
          <div className="songs-page__header-row">
            <span className="song-row__index">#</span>
            <span className="songs-page__header-label">Title</span>
            <span className="songs-page__header-label songs-page__header-label--album">Album</span>
            <span className="songs-page__header-label songs-page__header-label--duration">Duration</span>
          </div>
          <SongList songs={songs} />
        </>
      )}
    </div>
  );
}

export default AlbumDetail;
