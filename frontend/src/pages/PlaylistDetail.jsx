import { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import SongList from '../components/Songs/SongList';
import { useAuth } from '../context/AuthContext';
import { usePlaylists } from '../context/PlaylistsContext';
import { playlistsApi } from '../api/backend';
import { mapSong } from '../utils/mapSong';

function PlaylistDetail({ playlistId, onBack }) {
  const { token } = useAuth();
  const { removeSongFromPlaylist } = usePlaylists();
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

  const renderRemove = useCallback((song) => (
    <button
      className="playlist-detail__remove"
      onClick={async () => {
        await removeSongFromPlaylist(playlistId, song.id);
        setSongs((prev) => prev.filter((s) => s.id !== song.id));
      }}
      aria-label="Remove from playlist"
    >
      <Trash2 size={16} />
    </button>
  ), [playlistId, removeSongFromPlaylist]);

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
        <SongList songs={songs} extra={renderRemove} />
      )}
    </div>
  );
}

export default PlaylistDetail;
