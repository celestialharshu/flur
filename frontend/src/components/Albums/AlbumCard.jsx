import { Play } from 'lucide-react';

// onOpen: click anywhere on the card to open the album page.
// onPlay (optional): shows a hover play button that plays without opening.
function AlbumCard({ coverUrl, title, artist, onOpen, onPlay }) {
  return (
    <div
      className={`album-card ${onOpen ? 'album-card--clickable' : ''}`}
      onClick={onOpen}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && e.key === 'Enter') onOpen(); }}
      title={title}
    >
      <div className="album-card__cover-wrap">
        <img src={coverUrl} alt={title} className="album-card__cover" />
        {onPlay && (
          <button
            className="album-card__play"
            aria-label={`Play ${title}`}
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
          >
            <Play size={18} fill="currentColor" />
          </button>
        )}
      </div>
      <span className="album-card__title">{title}</span>
      <span className="album-card__artist text-secondary">{artist}</span>
    </div>
  );
}

export default AlbumCard;
