import { useState, useEffect } from 'react';
import AlbumCard from '../components/Albums/AlbumCard';
import { useAuth } from '../context/AuthContext';
import { albumsApi } from '../api/backend';

function AlbumsPage() {
  const { token } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    albumsApi.list(token)
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
    <div className="albums-page">
      <div className="section__header">
        <h2 className="section__title">Albums</h2>
      </div>

      {isLoading && <p className="text-secondary">Loading albums...</p>}
      {error && <p className="text-secondary">Couldn't load albums: {error}</p>}

      {!isLoading && !error && (
        <div className="albums-page__grid">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              coverUrl={album.coverUrl}
              title={album.title}
              artist={album.artist}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AlbumsPage;