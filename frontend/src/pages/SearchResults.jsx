import { useState, useEffect } from 'react';
import SongList from '../components/Songs/SongList';
import AlbumCard from '../components/Albums/AlbumCard';
import ArtistCard from '../components/Artists/ArtistCard';
import Loader from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';
import { searchApi } from '../api/backend';
import { mapSong, mapAlbum } from '../utils/mapSong';

const INITIAL_SONGS = 8;

function SearchResults({ query, onOpenAlbum, onOpenArtist }) {
  const q = query?.trim() || '';
  const { token } = useAuth();
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllSongs, setShowAllSongs] = useState(false);

  useEffect(() => {
    if (!q || !token) {
      setSongs([]); setAlbums([]); setArtists([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setShowAllSongs(false);

    searchApi.all(token, q)
      .then((data) => {
        if (cancelled) return;
        setSongs(data.songs.map(mapSong));
        setAlbums(data.albums.map(mapAlbum));
        setArtists(data.artists);
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [q, token]);

  const hasResults = songs.length > 0 || albums.length > 0 || artists.length > 0;
  const visibleSongs = showAllSongs ? songs : songs.slice(0, INITIAL_SONGS);

  return (
    <div className="search-results-page">
      <div className="section__header">
        <h2 className="section__title">Results for "{q}"</h2>
      </div>

      {isLoading && <Loader inline />}
      {!isLoading && error && <p className="text-secondary">Search failed: {error}</p>}
      {!isLoading && !error && !hasResults && q && (
        <p className="text-secondary">No results found. Try a different spelling or fewer words.</p>
      )}

      {!isLoading && artists.length > 0 && (
        <section className="section">
          <h3 className="search-results__subheading">Artists</h3>
          <div className="scroll-row">
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
        </section>
      )}

      {!isLoading && songs.length > 0 && (
        <section className="section">
          <h3 className="search-results__subheading">Songs</h3>
          <SongList songs={visibleSongs} queue={songs} />
          {songs.length > INITIAL_SONGS && (
            <div className="load-more">
              <button className="load-more__btn" onClick={() => setShowAllSongs((v) => !v)}>
                {showAllSongs ? 'Show fewer songs' : `Show all ${songs.length} songs`}
              </button>
            </div>
          )}
        </section>
      )}

      {!isLoading && albums.length > 0 && (
        <section className="section">
          <h3 className="search-results__subheading">Albums</h3>
          <div className="scroll-row">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                id={album.id}
                coverUrl={album.coverUrl}
                title={album.title}
                artist={album.artist}
                onOpen={onOpenAlbum}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default SearchResults;
