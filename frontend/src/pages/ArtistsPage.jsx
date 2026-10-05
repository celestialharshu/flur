import { useState, useEffect } from 'react';
import ArtistCard from '../components/Artists/ArtistCard';
import { useAuth } from '../context/AuthContext';
import { artistsApi } from '../api/backend';

const PAGE_SIZE = 40;

function ArtistsPage({ onOpenArtist }) {
  const { token } = useAuth();
  const [artists, setArtists] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    artistsApi.list(token, 0, PAGE_SIZE)
      .then(({ artists, hasMore }) => {
        setArtists(artists);
        setOffset(artists.length);
        setHasMore(hasMore);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const { artists: next, hasMore: more } = await artistsApi.list(token, offset, PAGE_SIZE);
      setArtists((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        return [...prev, ...next.filter((a) => !seen.has(a.id))];
      });
      setOffset((o) => o + next.length);
      setHasMore(more);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="artists-page">
      <div className="section__header">
        <h2 className="section__title">Artists</h2>
      </div>

      {isLoading && <p className="text-secondary">Loading artists...</p>}
      {error && <p className="text-secondary">Couldn't load artists: {error}</p>}

      {!isLoading && (
        <>
          <div className="artists-page__grid">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                id={artist.id}
                avatarUrl={artist.avatar_url}
                name={artist.name}
                onOpen={onOpenArtist}
              />
            ))}
          </div>

          {hasMore && (
            <div className="load-more">
              <button className="load-more__btn" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? 'Loading...' : 'Load more artists'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ArtistsPage;
