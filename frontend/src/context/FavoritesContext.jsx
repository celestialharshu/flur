import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { favoritesApi } from '../api/backend';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

const flip = (set, id) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

export function FavoritesProvider({ children }) {
  const { token } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  useEffect(() => {
    if (!token) {
      setFavoriteIds(new Set());
      return;
    }
    favoritesApi.list(token)
      .then(({ songs }) => setFavoriteIds(new Set(songs.map((s) => s.id))))
      .catch((err) => console.error('Failed to load favorites:', err.message));
  }, [token]);

  const toggleFavorite = useCallback(async (songId) => {
    // Optimistic update — flip locally first, then sync with backend
    setFavoriteIds((prev) => flip(prev, songId));
    try {
      await favoritesApi.toggle(token, songId);
    } catch (err) {
      console.error('Failed to toggle favorite:', err.message);
      setFavoriteIds((prev) => flip(prev, songId)); // revert on failure
    }
  }, [token]);

  const isFavorite = useCallback((songId) => favoriteIds.has(songId), [favoriteIds]);

  const value = useMemo(
    () => ({ favoriteIds, toggleFavorite, isFavorite }),
    [favoriteIds, toggleFavorite, isFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
}
