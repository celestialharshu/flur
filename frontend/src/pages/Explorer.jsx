import { useState, useEffect } from 'react';
import AlbumSection from '../components/Albums/AlbumSection';
import ArtistSection from '../components/Artists/ArtistSection';
import PlaylistSection from '../components/Playlists/PlaylistSection';
import { usePlaylists } from '../context/PlaylistsContext';
import { useAuth } from '../context/AuthContext';
import { recommendationsApi } from '../api/backend';

function Explorer() {
  const { token } = useAuth();
  const { playlists } = usePlaylists();
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    recommendationsApi.get(token)
      .then(({ albums }) => {
        setAlbums(albums.map((a) => ({
          id: a.id,
          title: a.title,
          artist: a.artist_name,
          coverUrl: a.cover_url,
        })));
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <div className="explorer-page">
      {isLoading && <p className="text-secondary">Loading your recommendations...</p>}
      {error && <p className="text-secondary">Couldn't load recommendations: {error}</p>}

      {!isLoading && !error && (
        <>
          <AlbumSection title="Albums" albums={albums} />
          {/* Artists section: backend has no standalone artist-recommendation
              endpoint yet — leaving this on user-derived data is a follow-up */}
          <PlaylistSection title="Playlists" playlists={playlists} />
        </>
      )}
    </div>
  );
}

export default Explorer;