import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PlaylistsProvider } from './context/PlaylistsContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { PlayerProvider } from './context/PlayerContext';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
<AuthProvider>
  <PlaylistsProvider>
    <FavoritesProvider>
      <PlayerProvider>
        <App />
      </PlayerProvider>
    </FavoritesProvider>
  </PlaylistsProvider>
</AuthProvider>
);