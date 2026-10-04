import { useState, useSyncExternalStore } from 'react';
import { subscribePending, getPendingCount } from './api/backend';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Explorer from './pages/Explorer';
import Songs from './pages/Songs';
import SearchResults from './pages/SearchResults';
import AlbumsPage from './pages/AlbumsPage';
import ArtistsPage from './pages/ArtistsPage';
import PlaylistsPage from './pages/PlaylistsPage';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import { useAuth } from './context/AuthContext';
import PlaylistDetail from './pages/PlaylistDetail';
import AlbumDetail from './pages/AlbumDetail';
import Loader from './components/common/Loader';
import './styles/tokens.css';
import './styles/globals.css';

function App() {
  const { user, isLoading, refreshUser } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [activeView, setActiveView] = useState('explorer');
  const [previousView, setPreviousView] = useState('explorer');
  const [searchQuery, setSearchQuery] = useState('');
  const [openPlaylistId, setOpenPlaylistId] = useState(null);
  const [openAlbumId, setOpenAlbumId] = useState(null);
  const isFetching = useSyncExternalStore(subscribePending, () => getPendingCount() > 0);


  if (isLoading) {
  return <Loader />;
  }

  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  if (!user.has_completed_onboarding) {
    return <Onboarding onComplete={refreshUser} />;
  }

 const handleNavigate = (view) => {
  if (view !== 'search') setPreviousView(view);
  if (view === 'playlists') setOpenPlaylistId(null); // reset to grid view on fresh nav click
  if (view === 'albums') setOpenAlbumId(null);
  setActiveView(view);
};

  const handleOpenAlbum = (albumId) => {
    setOpenAlbumId(albumId);
    setPreviousView('albums');
    setActiveView('albums');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (activeView !== 'search') setPreviousView(activeView);
    setActiveView('search');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveView(previousView);
  };

const pages = {
  explorer: <Explorer onOpenAlbum={handleOpenAlbum} />,
  songs: <Songs />,
  search: <SearchResults query={searchQuery} />,
  albums: openAlbumId
    ? <AlbumDetail albumId={openAlbumId} onBack={() => setOpenAlbumId(null)} />
    : <AlbumsPage onOpenAlbum={handleOpenAlbum} />,
  artists: <ArtistsPage />,
  playlists: openPlaylistId
    ? <PlaylistDetail playlistId={openPlaylistId} onBack={() => setOpenPlaylistId(null)} />
    : <PlaylistsPage onOpenPlaylist={setOpenPlaylistId} />,
  favorite: <Favorites />,
  settings: <Settings />,
};


  return (
    <MainLayout
      activeView={activeView}
      onNavigate={handleNavigate}
      user={user}
      onSearch={handleSearch}
      onClearSearch={handleClearSearch}
    >
      {isFetching && <Loader inline />}
      <div style={{ display: isFetching ? 'none' : 'block' }}>
        {pages[activeView] || <div>Page not found</div>}
      </div>
    </MainLayout>
  );
}

export default App;