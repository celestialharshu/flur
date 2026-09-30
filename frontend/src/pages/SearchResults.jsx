import { useState, useEffect, useMemo } from 'react';
import SongRow from '../pages/SongsRow';
import AlbumCard from '../components/Albums/AlbumCard';
import ArtistCard from '../components/Artists/ArtistCard';
import CreatePlaylistModal from '../components/Playlists/CreatePlaylistModal';
import { usePlaylists } from '../context/PlaylistsContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { songsApi } from '../api/backend';

function deriveAlbums(songs) {
  const seen = new Map();
  songs.forEach((song) => {
    if (song.album && !seen.has(song.album)) {
      seen.set(song.album, { id: song.album, title: song.album, artist: song.artist, coverUrl: song.thumbnail });
    }
  });
  return Array.from(seen.values());
}

function deriveArtists(songs) {
  const seen = new Map();
  songs.forEach((song) => {
    if (song.artist && !seen.has(song.artist)) {
      seen.set(song.artist, { id: song.artist, name: song.artist, avatarUrl: song.thumbnail });
    }
  });
  return Array.from(seen.values());
}

function SearchResults({ query }) {
  const q = query?.trim() || '';
  const { token } = useAuth();
  const [allResults, setAllResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingSongId, setPendingSongId] = useState(null);

  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylists();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentTrack, playTrack } = usePlayer();

  useEffect(() => {
    if (!q || !token) {
      setAllResults([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    songsApi.search(token, q)
      .then(({ songs }) => {
        if (!cancelled) setAllResults(songs);
      })
      .catch((err) => console.error('Search failed:', err.message))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [q, token]);

  const topSongs = useMemo(() => allResults.slice(0, 5), [allResults]);
  const albums = useMemo(() => deriveAlbums(allResults), [allResults]);
  const artists = useMemo(() => deriveArtists(allResults), [allResults]);
  const hasResults = topSongs.length > 0;

  const handleCreatePlaylist = (title) => {
    createPlaylist(title, pendingSongId);
    setPendingSongId(null);
  };

  return (
    <div className="search-results-page">
      <div className="section__header">
        <h2 className="section__title">Results for "{q}"</h2>
      </div>

      {isLoading && <p className="text-secondary">Searching...</p>}
      {!isLoading && !hasResults && q && <p className="text-secondary">No results found.</p>}

      {topSongs.length > 0 && (
        <section className="section">
          <h3 className="search-results__subheading">Songs</h3>
          <div className="songs-page__list">
            {topSongs.map((song, i) => (
              <SongRow
                key={song.id}
                id={song.id}
                index={i + 1}
                thumbnail={song.thumbnail}
                title={song.title}
                artist={song.artist}
                album={song.album}
                duration={`${Math.floor(song.durationSeconds / 60)}:${(song.durationSeconds % 60).toString().padStart(2, '0')}`}
                isFavorite={isFavorite(song.id)}
                onToggleFavorite={() => toggleFavorite(song.id)}
                isActive={currentTrack?.id === song.id}
                onPlay={() => playTrack(song, topSongs)}
                playlists={playlists}
                onAddToPlaylist={addSongToPlaylist}
                onCreatePlaylist={(songId) => setPendingSongId(songId)}
              />
            ))}
          </div>
        </section>
      )}

      {albums.length > 0 && (
        <section className="section">
          <h3 className="search-results__subheading">Albums</h3>
          <div className="scroll-row">
            {albums.map((album) => (
              <AlbumCard key={album.id} coverUrl={album.coverUrl} title={album.title} artist={album.artist} />
            ))}
          </div>
        </section>
      )}

      {artists.length > 0 && (
        <section className="section">
          <h3 className="search-results__subheading">Artists</h3>
          <div className="scroll-row">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} avatarUrl={artist.avatarUrl} name={artist.name} />
            ))}
          </div>
        </section>
      )}

      {pendingSongId !== null && (
        <CreatePlaylistModal onConfirm={handleCreatePlaylist} onCancel={() => setPendingSongId(null)} />
      )}
    </div>
  );
}

export default SearchResults;