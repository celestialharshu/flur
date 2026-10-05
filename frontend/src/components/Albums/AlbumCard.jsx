import { memo } from 'react';
import { Play } from 'lucide-react';
import { secureUrl } from '../../utils/media';

// onOpen(id): click anywhere on the card to open the album page.
// onPlay (optional): shows a hover play button that plays without opening.
function AlbumCard({ id, coverUrl, title, artist, onOpen, onPlay }) {
  const open = onOpen ? () => onOpen(id) : undefined;
  return (
    <div
      className={`album-card ${onOpen ? 'album-card--clickable' : ''}`}
      onClick={open}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (open && e.key === 'Enter') open(); }}
      title={title}
    >
      <div className="album-card__cover-wrap">
        <img src={secureUrl(coverUrl)} alt={title} className="album-card__cover" loading="lazy" decoding="async" />
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

export default memo(AlbumCard);
