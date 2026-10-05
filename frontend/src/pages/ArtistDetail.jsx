import { useState, useEffect } from 'react';
import { Play, Shuffle } from 'lucide-react';
import SongList from '../components/Songs/SongList';
import AlbumSection from '../components/Albums/AlbumSection';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { artistsApi } from '../api/backend';
import { mapSong, mapAlbum } from '../utils/mapSong';
import { secureUrl } from '../utils/media';
import { shuffled } from '../utils/shuffle';

const VISIBLE = 10;

function ArtistDetail({ artistId, onBack, onOpenAlbum }) {
  const { token } = useAuth();
  const { playTrack } = usePlayer();

  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
        setAlbums(albums.map(mapAlbum));
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

  const visibleSongs = showAll ? songs : songs.slice(0, VISIBLE);

  const handleShuffle = () => {
    if (songs.length === 0) return;
    const list = shuffled(songs);
    playTrack(list[0], list);
  };

  return (
    <div className="artist-detail">
      <button className="playlist-detail__back" onClick={onBack}>← Back to Artists</button>

      <div className="artist-detail__hero">
        <img src={secureUrl(artist.avatar_url)} alt={artist.name} className="artist-detail__avatar" />
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
            <SongList songs={visibleSongs} queue={songs} />
            {songs.length > VISIBLE && (
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
    </div>
  );
}

export default ArtistDetail;
