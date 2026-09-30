import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { favoritesApi } from '../api/backend';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { token } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());

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
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.has(songId) ? next.delete(songId) : next.add(songId);
      return next;
    });

    try {
      await favoritesApi.toggle(token, songId);
    } catch (err) {
      console.error('Failed to toggle favorite:', err.message);
      // Revert on failure
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.has(songId) ? next.delete(songId) : next.add(songId);
        return next;
      });
    }
  }, [token]);

  const isFavorite = useCallback((songId) => favoriteIds.has(songId), [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
}