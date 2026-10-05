import { useState, useEffect, useMemo, useCallback } from 'react';
import { Play, Shuffle } from 'lucide-react';
import AlbumSection from '../components/Albums/AlbumSection';
import PlaylistSection from '../components/Playlists/PlaylistSection';
import SongSection from '../components/Songs/SongSection';
import { usePlaylists } from '../context/PlaylistsContext';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { recommendationsApi, historyApi } from '../api/backend';
import { mapSong, mapAlbum } from '../utils/mapSong';
import { shuffled } from '../utils/shuffle';

const RECENT_LIMIT = 20;
const SUGGESTION_COUNT = 12;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function Explorer({ onOpenAlbum }) {
  const { token, user } = useAuth();
  const { playlists } = usePlaylists();
  const { currentTrack, playTrack } = usePlayer();

  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState(null);

  // Recommendations (albums + songs) — these reshuffle on refresh
  useEffect(() => {
    if (!token) return;
    recommendationsApi.get(token)
      .then(({ albums, songs }) => {
        setAlbums(albums.map(mapAlbum));
        setSongs(songs.map(mapSong));
      })
      .catch((err) => setError(err.message));
  }, [token]);

  // Recently played — loaded from the user's listen history, NOT from the
  // recommendation feed, so it never reshuffles; it only grows as they listen.
  useEffect(() => {
    if (!token) return;
    historyApi.recent(token, RECENT_LIMIT)
      .then(({ songs }) => setRecent(songs.map(mapSong)))
      .catch((err) => console.warn('Failed to load recently played:', err.message));
  }, [token]);

  // Keep the row live while the user is on this page: whatever starts playing
  // jumps to the front (no refetch needed).
  useEffect(() => {
    if (!currentTrack?.id) return;
    setRecent((prev) =>
      [currentTrack, ...prev.filter((s) => s.id !== currentTrack.id)].slice(0, RECENT_LIMIT)
    );
  }, [currentTrack?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = useMemo(() => songs.slice(0, SUGGESTION_COUNT), [songs]);

  // Album click -> play the recommended songs that belong to that album
  const songsByAlbum = useMemo(() => {
    const m = new Map();
    for (const s of songs) {
      const l = m.get(s.album);
      if (l) l.push(s);
      else m.set(s.album, [s]);
    }
    return m;
  }, [songs]);

  const getAlbumPlayHandler = useCallback((album) => {
    const list = songsByAlbum.get(album.title);
    return list ? () => playTrack(list[0], list) : undefined;
  }, [songsByAlbum, playTrack]);

  const handleShuffleAll = () => {
    if (songs.length === 0) return;
    const list = shuffled(songs);
    playTrack(list[0], list);
  };

  return (
    <div className="explorer-page">
      <div className="explorer-hero">
        <div>
          <h1 className="explorer-hero__title">
            {getGreeting()}{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="explorer-hero__subtitle">Pick up where you left off, or discover something new.</p>
        </div>
        {songs.length > 0 && (
          <div className="explorer-hero__actions">
            <button className="explorer-hero__btn explorer-hero__btn--primary" onClick={() => playTrack(songs[0], songs)}>
              <Play size={16} fill="currentColor" /> Play for me
            </button>
            <button className="explorer-hero__btn" onClick={handleShuffleAll}>
              <Shuffle size={16} /> Shuffle
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-secondary">Couldn't load recommendations: {error}</p>}

      <SongSection
        title="Recently played"
        subtitle="Your latest listens"
        songs={recent}
        layout="row"
        emptyMessage="Nothing here yet — songs you play will show up here."
      />

      {albums.length > 0 && (
        <AlbumSection title="Albums" albums={albums} onPlayAlbum={getAlbumPlayHandler} onOpenAlbum={onOpenAlbum} />
      )}

      {suggestions.length > 0 && (
        <SongSection
          title="You might also like"
          subtitle="Handpicked from your favorite genres"
          songs={suggestions}
          layout="grid"
        />
      )}

      {playlists.length > 0 && <PlaylistSection title="Playlists" playlists={playlists} />}
    </div>
  );
}

export default Explorer;
