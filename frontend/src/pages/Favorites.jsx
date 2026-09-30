import { useState, useEffect } from 'react';
import SongRow from '../pages/SongsRow';
import CreatePlaylistModal from '../components/Playlists/CreatePlaylistModal';
import { useFavorites } from '../context/FavoritesContext';
import { usePlaylists } from '../context/PlaylistsContext';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { favoritesApi } from '../api/backend';

function mapSong(s) {
  const mins = Math.floor(s.duration_seconds / 60);
  const secs = s.duration_seconds % 60;
  return {
    id: s.id,
    title: s.title,
    artist: s.artist_name,
    album: s.album_title,
    duration: `${mins}:${secs.toString().padStart(2, '0')}`,
    thumbnail: s.thumbnail_url,
    streamUrl: s.stream_url,
  };
}

function Favorites() {
  const { token } = useAuth();
  const { isFavorite, toggleFavorite, favoriteIds } = useFavorites();
  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylists();
  const { currentTrack, playTrack } = usePlayer();
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSongId, setPendingSongId] = useState(null);

  useEffect(() => {
    if (!token) return;
    favoritesApi.list(token)
      .then(({ songs }) => setFavoriteSongs(songs.map(mapSong)))
      .catch((err) => console.error('Failed to load favorites:', err.message))
      .finally(() => setIsLoading(false));
  }, [token, favoriteIds]); // re-fetch whenever favoriteIds changes (a favorite was toggled)

  const handleCreatePlaylist = (title) => {
    createPlaylist(title, pendingSongId);
    setPendingSongId(null);
  };

  return (
    <div className="favorites-page">
      <div className="section__header">
        <h2 className="section__title">Favorite</h2>
      </div>

      {isLoading && <p className="text-secondary">Loading...</p>}

      {!isLoading && favoriteSongs.length === 0 ? (
        <p className="text-secondary">
          No favorites yet — tap the heart on any song to add it here.
        </p>
      ) : (
        <div className="songs-page__list">
          {favoriteSongs.map((song, i) => (
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
              onPlay={() => playTrack(song, favoriteSongs)}
              playlists={playlists}
              onAddToPlaylist={addSongToPlaylist}
              onCreatePlaylist={(songId) => setPendingSongId(songId)}
            />
          ))}
        </div>
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

export default Favorites;