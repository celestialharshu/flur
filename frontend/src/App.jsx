import { useState, useRef, useCallback, useSyncExternalStore } from 'react';
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
import Equalizer from './pages/Equalizer';
import { useAuth } from './context/AuthContext';
import PlaylistDetail from './pages/PlaylistDetail';
import AlbumDetail from './pages/AlbumDetail';
import ArtistDetail from './pages/ArtistDetail';
import Loader from './components/common/Loader';
import './styles/tokens.css';
import './styles/globals.css';

const isBusy = () => getPendingCount() > 0;

function App() {
  const { user, isLoading, refreshUser } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [activeView, setActiveView] = useState('explorer');
  const [previousView, setPreviousView] = useState('explorer');
  const [searchQuery, setSearchQuery] = useState('');
  const [openPlaylistId, setOpenPlaylistId] = useState(null);
  const [openAlbumId, setOpenAlbumId] = useState(null);
  const [openArtistId, setOpenArtistId] = useState(null);
  const isFetching = useSyncExternalStore(subscribePending, isBusy);

  // Handlers are created once, so the memoized layout parts never re-render because of them.
  const views = useRef({});
  views.current = { activeView, previousView };

  const handleNavigate = useCallback((view) => {
    if (view !== 'search') setPreviousView(view);
    if (view === 'playlists') setOpenPlaylistId(null); // reset to grid view on fresh nav click
    if (view === 'albums') setOpenAlbumId(null);
    if (view === 'artists') setOpenArtistId(null);
    setActiveView(view);
  }, []);

  const handleOpenAlbum = useCallback((albumId) => {
    setOpenAlbumId(albumId);
    setPreviousView('albums');
    setActiveView('albums');
  }, []);

  const handleOpenArtist = useCallback((artistId) => {
    setOpenArtistId(artistId);
    setPreviousView('artists');
    setActiveView('artists');
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (views.current.activeView !== 'search') setPreviousView(views.current.activeView);
    setActiveView('search');
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setActiveView(views.current.previousView);
  }, []);

  const closeAlbum = useCallback(() => setOpenAlbumId(null), []);
  const closeArtist = useCallback(() => setOpenArtistId(null), []);
  const closePlaylist = useCallback(() => setOpenPlaylistId(null), []);
  const switchToSignup = useCallback(() => setAuthView('signup'), []);
  const switchToLogin = useCallback(() => setAuthView('login'), []);

  if (isLoading) {
    return <Loader />;
  }

  if (!user) {
    return authView === 'login'
      ? <Login onSwitchToSignup={switchToSignup} />
      : <Signup onSwitchToLogin={switchToLogin} />;
  }

  if (!user.has_completed_onboarding) {
    return <Onboarding onComplete={refreshUser} />;
  }

  // Only the page on screen is created.
  let page;
  switch (activeView) {
    case 'explorer':
      page = <Explorer onOpenAlbum={handleOpenAlbum} />;
      break;
    case 'songs':
      page = <Songs />;
      break;
    case 'search':
      page = <SearchResults query={searchQuery} onOpenAlbum={handleOpenAlbum} onOpenArtist={handleOpenArtist} />;
      break;
    case 'albums':
      page = openAlbumId
        ? <AlbumDetail albumId={openAlbumId} onBack={closeAlbum} />
        : <AlbumsPage onOpenAlbum={handleOpenAlbum} />;
      break;
    case 'artists':
      page = openArtistId
        ? <ArtistDetail artistId={openArtistId} onBack={closeArtist} onOpenAlbum={handleOpenAlbum} />
        : <ArtistsPage onOpenArtist={handleOpenArtist} />;
      break;
    case 'playlists':
      page = openPlaylistId
        ? <PlaylistDetail playlistId={openPlaylistId} onBack={closePlaylist} />
        : <PlaylistsPage onOpenPlaylist={setOpenPlaylistId} />;
      break;
    case 'favorite':
      page = <Favorites />;
      break;
    case 'settings':
      page = <Settings />;
      break;
    case 'equalizer':
      page = <Equalizer />;
      break;
    default:
      page = <div>Page not found</div>;
  }

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
        {page}
      </div>
    </MainLayout>
  );
}

export default App;
