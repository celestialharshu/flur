import { useState, useEffect, useMemo, useRef } from 'react';
import SongList from '../components/Songs/SongList';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { favoritesApi } from '../api/backend';
import { mapSong } from '../utils/mapSong';

function Favorites() {
  const { token } = useAuth();
  const { favoriteIds } = useFavorites();
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetched = useRef(false);

  // Is there a favorite we haven't downloaded yet (hearted somewhere else, e.g. the player bar)?
  const stale = useMemo(() => {
    const have = new Set(songs.map((s) => s.id));
    for (const id of favoriteIds) if (!have.has(id)) return true;
    return false;
  }, [songs, favoriteIds]);

  // Load once, and again only when a NEW favorite appears. Un-hearting just hides the
  // row below, so toggling a heart on this page no longer re-downloads the whole list.
  useEffect(() => {
    if (!token || (fetched.current && !stale)) return undefined;
    let off = false;
    favoritesApi.list(token)
      .then(({ songs }) => {
        if (off) return;
        fetched.current = true;
        setSongs(songs.map(mapSong));
      })
      .catch((err) => console.error('Failed to load favorites:', err.message))
      .finally(() => { if (!off) setIsLoading(false); });
    return () => { off = true; };
  }, [token, stale]);

  const list = useMemo(() => songs.filter((s) => favoriteIds.has(s.id)), [songs, favoriteIds]);

  return (
    <div className="favorites-page">
      <div className="section__header">
        <h2 className="section__title">Favorite</h2>
      </div>

      {isLoading && <p className="text-secondary">Loading...</p>}

      {!isLoading && list.length === 0 ? (
        <p className="text-secondary">
          No favorites yet — tap the heart on any song to add it here.
        </p>
      ) : (
        <SongList songs={list} />
      )}
    </div>
  );
}

export default Favorites;
