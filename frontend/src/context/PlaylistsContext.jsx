import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { playlistsApi } from '../api/backend';
import { secureUrl } from '../utils/media';
import { useAuth } from './AuthContext';

const PlaylistsContext = createContext(null);

export function PlaylistsProvider({ children }) {
  const { token } = useAuth();
  const [playlists, setPlaylists] = useState([]);

  const reload = useCallback(() => {
    if (!token) {
      setPlaylists([]);
      return;
    }
    playlistsApi.list(token)
      .then(({ playlists }) => {
        setPlaylists(playlists.map((p) => ({
          id: p.id,
          title: p.title,
          songIds: p.songs.map((s) => s.songId),
          thumbnails: p.songs.slice(0, 4).map((s) => secureUrl(s.thumbnail)).filter(Boolean),
        })));
      })
      .catch((err) => console.error('Failed to load playlists:', err.message));
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const addSongToPlaylist = useCallback(async (playlistId, songId) => {
    try {
      await playlistsApi.addSong(token, playlistId, songId);
      reload();
    } catch (err) {
      console.error('Failed to add song to playlist:', err.message);
    }
  }, [token, reload]);

  const removeSongFromPlaylist = useCallback(async (playlistId, songId) => {
    try {
      await playlistsApi.removeSong(token, playlistId, songId);
      reload();
    } catch (err) {
      console.error('Failed to remove song from playlist:', err.message);
    }
  }, [token, reload]);

  const createPlaylist = useCallback(async (title, initialSongId = null) => {
    try {
      await playlistsApi.create(token, title, initialSongId);
      reload();
    } catch (err) {
      console.error('Failed to create playlist:', err.message);
    }
  }, [token, reload]);

  const value = useMemo(
    () => ({ playlists, addSongToPlaylist, removeSongFromPlaylist, createPlaylist }),
    [playlists, addSongToPlaylist, removeSongFromPlaylist, createPlaylist]
  );

  return <PlaylistsContext.Provider value={value}>{children}</PlaylistsContext.Provider>;
}

export function usePlaylists() {
  const context = useContext(PlaylistsContext);
  if (!context) throw new Error('usePlaylists must be used within a PlaylistsProvider');
  return context;
}
