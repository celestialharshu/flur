import { memo } from 'react';
import { Play, Pause, Heart } from 'lucide-react';

function PlayingBars() {
  return (
    <span className="playing-bars" aria-label="Now playing">
      <span /><span /><span />
    </span>
  );
}

// Handlers are shared by every card: onPlay(song) and onToggleFavorite(id).
// `isPlaying` should only be true for the active card, so the others never re-render.

// Square card used in horizontal rows (e.g. Recently played)
export const SongCard = memo(function SongCard({ song, isActive, isPlaying, isFavorite, onPlay, onToggleFavorite }) {
  return (
    <div className={`song-card ${isActive ? 'song-card--active' : ''}`} onClick={() => onPlay(song)}>
      <div className="song-card__cover-wrap">
        <img src={song.thumbnail} alt={song.title} className="song-card__cover" loading="lazy" decoding="async" />
        <button
          className="song-card__play"
          aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
          onClick={(e) => { e.stopPropagation(); onPlay(song); }}
        >
          {isActive && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <button
          className={`song-card__fav ${isFavorite ? 'song-card__fav--on' : ''}`}
          aria-label="Toggle favorite"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(song.id); }}
        >
          <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <span className="song-card__title">{song.title}</span>
      <span className="song-card__artist">{song.artist}</span>
    </div>
  );
});

// Compact row used in grids (e.g. You might also like)
export const SongTile = memo(function SongTile({ song, isActive, isPlaying, isFavorite, onPlay, onToggleFavorite }) {
  return (
    <div className={`song-tile ${isActive ? 'song-tile--active' : ''}`} onClick={() => onPlay(song)}>
      <div className="song-tile__thumb-wrap">
        <img src={song.thumbnail} alt={song.title} className="song-tile__thumb" loading="lazy" decoding="async" />
        <span className="song-tile__overlay">
          {isActive && isPlaying ? <PlayingBars /> : <Play size={16} fill="currentColor" />}
        </span>
      </div>
      <div className="song-tile__info">
        <span className="song-tile__title">{song.title}</span>
        <span className="song-tile__artist">{song.artist}</span>
      </div>
      <button
        className={`song-tile__fav ${isFavorite ? 'song-tile__fav--on' : ''}`}
        aria-label="Toggle favorite"
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(song.id); }}
      >
        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <span className="song-tile__duration">{song.duration}</span>
    </div>
  );
});
