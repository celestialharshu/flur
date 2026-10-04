import { useState, useEffect } from 'react';
import { Play, Shuffle } from 'lucide-react';
import SongRow from './SongsRow';
import AlbumSection from '../components/Albums/AlbumSection';
import CreatePlaylistModal from '../components/Playlists/CreatePlaylistModal';
import { useAuth } from '../context/AuthContext';
import { usePlaylists } from '../context/PlaylistsContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePlayer } from '../context/PlayerContext';
import { artistsApi } from '../api/backend';
import { mapSong } from '../utils/mapSong';

function ArtistDetail({ artistId, onBack, onOpenAlbum }) {
  const { token } = useAuth();
  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylists();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentTrack, playTrack } = usePlayer();

  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingSongId, setPendingSongId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!token || !artistId) return;
    setIsLoading(true);
    setError(null);
    setShowAll(false);
    artistsApi.get(token, artistId)
      .then(({ artist, songs, albums }) => {
        setArtist(artist);
        setSongs(songs.map(mapSong));
        setAlbums(albums.map((a) => ({
          id: a.id, title: a.title, artist: a.artist_name, coverUrl: a.cover_url,
        })));
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token, artistId]);

  if (isLoading) return null; // the global loader is showing

  if (error || !artist) {
    return (
      <div className="artist-detail">
        <button className="playlist-detail__back" onClick={onBack}>← Back to Artists</button>
        <p className="text-secondary">{error || 'Artist not found.'}</p>
      </div>
    );
  }

  const visibleSongs = showAll ? songs : songs.slice(0, 10);

  const handleShuffle = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], shuffled);
  };

  return (
    <div className="artist-detail">
      <button className="playlist-detail__back" onClick={onBack}>← Back to Artists</button>

      <div className="artist-detail__hero">
        <img src={artist.avatar_url} alt={artist.name} className="artist-detail__avatar" />
        <div className="album-detail__meta">
          <span className="text-muted">ARTIST</span>
          <h1 className="album-detail__title">{artist.name}</h1>
          <span className="text-secondary">
            {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            {albums.length > 0 ? ` · ${albums.length} ${albums.length === 1 ? 'album' : 'albums'}` : ''}
          </span>
          {songs.length > 0 && (
            <div className="explorer-hero__actions album-detail__actions">
              <button className="explorer-hero__btn explorer-hero__btn--primary" onClick={() => playTrack(songs[0], songs)}>
                <Play size={16} fill="currentColor" /> Play
              </button>
              <button className="explorer-hero__btn" onClick={handleShuffle}>
                <Shuffle size={16} /> Shuffle
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="section">
        <div className="section__header">
          <h2 className="section__title">Popular</h2>
        </div>

        {songs.length === 0 ? (
          <p className="text-secondary">No songs found for this artist yet.</p>
        ) : (
          <>
            <div className="songs-page__list">
              {visibleSongs.map((song, i) => (
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
            {songs.length > 10 && (
              <div className="load-more">
                <button className="load-more__btn" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'Show less' : `Show all ${songs.length} songs`}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {albums.length > 0 && (
        <AlbumSection title="Albums" albums={albums} onOpenAlbum={onOpenAlbum} />
      )}

      {pendingSongId !== null && (
        <CreatePlaylistModal
          onConfirm={(title) => { createPlaylist(title, pendingSongId); setPendingSongId(null); }}
          onCancel={() => setPendingSongId(null)}
        />
      )}
    </div>
  );
}

export default ArtistDetail;
