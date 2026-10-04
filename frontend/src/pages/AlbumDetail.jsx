import { useState, useEffect } from 'react';
import { Play, Shuffle } from 'lucide-react';
import SongRow from './SongsRow';
import CreatePlaylistModal from '../components/Playlists/CreatePlaylistModal';
import { useAuth } from '../context/AuthContext';
import { usePlaylists } from '../context/PlaylistsContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePlayer } from '../context/PlayerContext';
import { albumsApi } from '../api/backend';
import { mapSong } from '../utils/mapSong';

function AlbumDetail({ albumId, onBack }) {
  const { token } = useAuth();
  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylists();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentTrack, playTrack } = usePlayer();

  const [album, setAlbum] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingSongId, setPendingSongId] = useState(null);

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

  if (isLoading) return null; // the global loader is showing

  if (error || !album) {
    return (
      <div className="album-detail">
        <button className="playlist-detail__back" onClick={onBack}>← Back to Albums</button>
        <p className="text-secondary">{error || 'Album not found.'}</p>
      </div>
    );
  }

  const totalSeconds = songs.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  const handleShuffle = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], shuffled);
  };

  return (
    <div className="album-detail">
      <button className="playlist-detail__back" onClick={onBack}>← Back to Albums</button>

      <div className="album-detail__hero">
        <img src={album.cover_url} alt={album.title} className="album-detail__cover" />
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
          <div className="songs-page__list">
            {songs.map((song, i) => (
              <SongRow
                key={song.id}
                id={song.id}
                index={i + 1}
                thumbnail={song.thumbnail}
                title={song.title}
                artist={song.artist}
                album={song.album}
                duration={song.duration}
                isFavorite={isFavorite(song.id)}
                onToggleFavorite={() => toggleFavorite(song.id)}
                isActive={currentTrack?.id === song.id}
                onPlay={() => playTrack(song, songs)}
                playlists={playlists}
                onAddToPlaylist={addSongToPlaylist}
                onCreatePlaylist={(songId) => setPendingSongId(songId)}
              />
            ))}
          </div>
        </>
      )}

      {pendingSongId !== null && (
        <CreatePlaylistModal
          onConfirm={(title) => { createPlaylist(title, pendingSongId); setPendingSongId(null); }}
          onCancel={() => setPendingSongId(null)}
        />
      )}
    </div>
  );
}

export default AlbumDetail;
