import { useState, useEffect } from 'react';
import SongRow from './SongsRow';
import CreatePlaylistModal from '../components/Playlists/CreatePlaylistModal';
import { usePlaylists } from '../context/PlaylistsContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { recommendationsApi } from '../api/backend';

function mapSong(s) {
  const mins = Math.floor(s.duration_seconds / 60);
  const secs = s.duration_seconds % 60;
  return {
    id: s.id,
    title: s.title,
    artist: s.artist_name,
    album: s.album_title,
    duration: `${mins}:${secs.toString().padStart(2, '0')}`,
    durationSeconds: s.duration_seconds,
    thumbnail: s.thumbnail_url,
    streamUrl: s.stream_url,
  };
}

function Songs() {
  const { token } = useAuth();
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingSongId, setPendingSongId] = useState(null);

  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylists();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentTrack, playTrack } = usePlayer();

  useEffect(() => {
    if (!token) return;

    recommendationsApi.get(token)
      .then(({ songs }) => setSongs(songs.map(mapSong)))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleCreatePlaylist = (title) => {
    createPlaylist(title, pendingSongId);
    setPendingSongId(null);
  };

  return (
    <div className="songs-page">
      <div className="section__header">
        <h2 className="section__title">Recommended for you</h2>
      </div>

      {isLoading && <p className="text-secondary">Loading your recommendations...</p>}
      {error && <p className="text-secondary">Couldn't load songs: {error}</p>}

      {!isLoading && !error && (
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
          onConfirm={handleCreatePlaylist}
          onCancel={() => setPendingSongId(null)}
        />
      )}
    </div>
  );
}

export default Songs;