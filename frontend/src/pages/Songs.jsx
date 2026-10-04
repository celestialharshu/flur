import { useState, useEffect } from 'react';
import SongRow from './SongsRow';
import CreatePlaylistModal from '../components/Playlists/CreatePlaylistModal';
import { usePlaylists } from '../context/PlaylistsContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { recommendationsApi, songsApi } from '../api/backend';
import { mapSong } from '../utils/mapSong';

const PAGE_SIZE = 30;

function Songs() {
  const { token } = useAuth();
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingSongId, setPendingSongId] = useState(null);
  const [browseOffset, setBrowseOffset] = useState(0);
  const [dbExhausted, setDbExhausted] = useState(false);
  const [discoverPage, setDiscoverPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(null);

  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylists();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentTrack, playTrack } = usePlayer();

  useEffect(() => {
    if (!token) return;

    recommendationsApi.get(token)
      .then(({ songs }) => setSongs(songs.map(mapSong)))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  // "Load more": first walks through songs already saved in our DB (your genres
  // first), then keeps going by discovering NEW songs from JioSaavn.
  // Songs already on screen are skipped; if a batch is all duplicates we
  // quietly fetch the next one so a click always adds something.
  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      let source = dbExhausted ? 'jio' : 'db';
      let offset = browseOffset;
      let page = discoverPage;
      let more = true;
      const shown = new Set(songs.map((s) => s.id));
      const fresh = [];
      let exhausted = dbExhausted;

      for (let attempt = 0; attempt < 6 && more && fresh.length === 0; attempt++) {
        let batch;
        if (source === 'db') {
          const res = await songsApi.browse(token, offset, PAGE_SIZE);
          batch = res.songs;
          offset += res.songs.length;
          if (!res.hasMore) { exhausted = true; source = 'jio'; }
        } else {
          const res = await songsApi.discover(token, page);
          batch = res.songs;
          page += 1;
          more = res.hasMore;
        }
        for (const s of batch.map(mapSong)) {
          if (!shown.has(s.id)) { shown.add(s.id); fresh.push(s); }
        }
      }

      setSongs((prev) => [...prev, ...fresh]);
      setBrowseOffset(offset);
      setDiscoverPage(page);
      setDbExhausted(exhausted);
      setHasMore(more);
    } catch (err) {
      setLoadMoreError(err.message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCreatePlaylist = (title) => {
    createPlaylist(title, pendingSongId);
    setPendingSongId(null);
  };

  return (
    <div className="songs-page">
      <div className="section__header">
        <h2 className="section__title">Recommended for you</h2>
      </div>

      {isLoading && <p className="text-secondary">Loading your recommendations...</p>}
      {error && <p className="text-secondary">Couldn't load songs: {error}</p>}

      {!isLoading && !error && (
        <>
          <div className="songs-page__header-row">
            <span className="song-row__index">#</span>
            <span className="songs-page__header-label">Title</span>
            <span className="songs-page__header-label songs-page__header-label--album">Album</span>
            <span className="songs-page__header-label songs-page__header-label--duration">Duration</span>
          </div>

          <div className="songs-page__list">
            {songs.map((song, i) => (
              <SongRow
                key={song.id}
                id={song.id}
                index={i + 1}
                thumbnail={song.thumbnail}
                title={song.title}
                artist={song.artist}
                album={song.album}
                duration={song.duration}
                isFavorite={isFavorite(song.id)}
                onToggleFavorite={() => toggleFavorite(song.id)}
                isActive={currentTrack?.id === song.id}
                onPlay={() => playTrack(song, songs)}
                playlists={playlists}
                onAddToPlaylist={addSongToPlaylist}
                onCreatePlaylist={(songId) => setPendingSongId(songId)}
              />
            ))}
          </div>

          {loadMoreError && <p className="text-secondary">Couldn't load more songs: {loadMoreError}</p>}

          {hasMore && (
            <div className="load-more">
              <button className="load-more__btn" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? 'Loading...' : 'Load more songs'}
              </button>
            </div>
          )}
        </>
      )}

      {pendingSongId !== null && (
        <CreatePlaylistModal
          onConfirm={handleCreatePlaylist}
          onCancel={() => setPendingSongId(null)}
        />
      )}
    </div>
  );
}

export default Songs;