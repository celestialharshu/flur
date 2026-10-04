import { Play, Pause, Heart } from 'lucide-react';

function PlayingBars() {
  return (
    <span className="playing-bars" aria-label="Now playing">
      <span /><span /><span />
    </span>
  );
}

// Square card used in horizontal rows (e.g. Recently played)
export function SongCard({ song, isActive, isPlaying, isFavorite, onPlay, onToggleFavorite }) {
  return (
    <div className={`song-card ${isActive ? 'song-card--active' : ''}`} onClick={onPlay}>
      <div className="song-card__cover-wrap">
        <img src={song.thumbnail} alt={song.title} className="song-card__cover" />
        <button
          className="song-card__play"
          aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
        >
          {isActive && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <button
          className={`song-card__fav ${isFavorite ? 'song-card__fav--on' : ''}`}
          aria-label="Toggle favorite"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        >
          <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <span className="song-card__title">{song.title}</span>
      <span className="song-card__artist">{song.artist}</span>
    </div>
  );
}

// Compact row used in grids (e.g. You might also like)
export function SongTile({ song, isActive, isPlaying, isFavorite, onPlay, onToggleFavorite }) {
  return (
    <div className={`song-tile ${isActive ? 'song-tile--active' : ''}`} onClick={onPlay}>
      <div className="song-tile__thumb-wrap">
        <img src={song.thumbnail} alt={song.title} className="song-tile__thumb" />
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
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
      >
        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <span className="song-tile__duration">{song.duration}</span>
    </div>
  );
}
