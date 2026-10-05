import { memo } from 'react';
import { secureUrl } from '../../utils/media';

// onOpen(id): click anywhere on the card to open the artist page.
function ArtistCard({ id, avatarUrl, name, onOpen }) {
  const open = onOpen ? () => onOpen(id) : undefined;
  return (
    <div
      className={`artist-card ${onOpen ? 'artist-card--clickable' : ''}`}
      onClick={open}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (open && e.key === 'Enter') open(); }}
      title={name}
    >
      <img src={secureUrl(avatarUrl)} alt={name} className="artist-card__avatar" loading="lazy" decoding="async" />
      <span className="artist-card__name">{name}</span>
    </div>
  );
}

export default memo(ArtistCard);
