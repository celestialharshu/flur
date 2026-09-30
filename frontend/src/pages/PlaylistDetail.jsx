import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import SongRow from '../pages/SongsRow';
import { useAuth } from '../context/AuthContext';
import { usePlaylists } from '../context/PlaylistsContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePlayer } from '../context/PlayerContext';
import { playlistsApi } from '../api/backend';

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

function PlaylistDetail({ playlistId, onBack }) {
  const { token } = useAuth();
  const { playlists, addSongToPlaylist, removeSongFromPlaylist } = usePlaylists();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentTrack, playTrack } = usePlayer();
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || !playlistId) return;
    setIsLoading(true);
    playlistsApi.get(token, playlistId)
      .then(({ playlist }) => {
        setPlaylist(playlist);
        setSongs(playlist.songs.map(mapSong));
      })
      .catch((err) => console.error('Failed to load playlist:', err.message))
      .finally(() => setIsLoading(false));
  }, [token, playlistId]);

  if (isLoading) {
    return <p className="text-secondary">Loading playlist...</p>;
  }

  if (!playlist) {
    return <p className="text-secondary">Playlist not found.</p>;
  }

  return (
    <div className="playlist-detail-page">
      <div className="section__header">
        <div>
          <button className="playlist-detail__back" onClick={onBack}>← Back to Playlists</button>
          <h2 className="section__title">{playlist.title}</h2>
          <span className="text-secondary">{songs.length} songs</span>
        </div>
      </div>

      {songs.length === 0 ? (
        <p className="text-secondary">No songs in this playlist yet.</p>
      ) : (
        <div className="songs-page__list">
          {songs.map((song, i) => (
            <div key={song.id} className="playlist-detail__row">
              <SongRow
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
                onCreatePlaylist={() => {}}
              />
              <button
                className="playlist-detail__remove"
                onClick={async () => {
                  await removeSongFromPlaylist(playlist.id, song.id);
                  setSongs((prev) => prev.filter((s) => s.id !== song.id));
                }}
                aria-label="Remove from playlist"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlaylistDetail;