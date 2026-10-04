import { useState, useEffect } from 'react';
import AlbumCard from '../components/Albums/AlbumCard';
import { useAuth } from '../context/AuthContext';
import { albumsApi } from '../api/backend';

const PAGE_SIZE = 30;

function mapAlbum(a) {
  return { id: a.id, title: a.title, artist: a.artist_name, coverUrl: a.cover_url };
}

function AlbumsPage({ onOpenAlbum }) {
  const { token } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    albumsApi.list(token, 0, PAGE_SIZE)
      .then(({ albums, hasMore }) => {
        setAlbums(albums.map(mapAlbum));
        setOffset(albums.length);
        setHasMore(hasMore);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const { albums: next, hasMore: more } = await albumsApi.list(token, offset, PAGE_SIZE);
      setAlbums((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        return [...prev, ...next.map(mapAlbum).filter((a) => !seen.has(a.id))];
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
    <div className="albums-page">
      <div className="section__header">
        <h2 className="section__title">Albums</h2>
      </div>

      {isLoading && <p className="text-secondary">Loading albums...</p>}
      {error && <p className="text-secondary">Couldn't load albums: {error}</p>}

      {!isLoading && (
        <>
          <div className="albums-page__grid">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                coverUrl={album.coverUrl}
                title={album.title}
                artist={album.artist}
                onOpen={() => onOpenAlbum?.(album.id)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="load-more">
              <button className="load-more__btn" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? 'Loading...' : 'Load more albums'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AlbumsPage;
