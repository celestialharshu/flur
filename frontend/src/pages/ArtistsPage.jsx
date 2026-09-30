import { useState, useEffect } from 'react';
import ArtistCard from '../components/Artists/ArtistCard';
import { useAuth } from '../context/AuthContext';
import { artistsApi } from '../api/backend';

function ArtistsPage() {
  const { token } = useAuth();
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    artistsApi.list(token)
      .then(({ artists }) => setArtists(artists))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <div className="artists-page">
      <div className="section__header">
        <h2 className="section__title">Artists</h2>
      </div>

      {isLoading && <p className="text-secondary">Loading artists...</p>}
      {error && <p className="text-secondary">Couldn't load artists: {error}</p>}

      {!isLoading && !error && (
        <div className="artists-page__grid">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} avatarUrl={artist.avatar_url} name={artist.name} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ArtistsPage;