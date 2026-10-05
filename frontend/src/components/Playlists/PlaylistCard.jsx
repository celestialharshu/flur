import { memo } from 'react';

function PlaylistCard({ id, thumbnails = [], title, songCount, onOpen }) {
  return (
    <div className="playlist-card" onClick={onOpen ? () => onOpen(id) : undefined}>
      <div className="playlist-card__collage">
        {thumbnails.slice(0, 4).map((thumb, i) => (
          <img
            key={i}
            src={thumb}
            alt=""
            className="playlist-card__thumb"
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>
      <span className="playlist-card__title">{title}</span>
      <span className="playlist-card__count text-muted">
        ({songCount} songs)
      </span>
    </div>
  );
}

export default memo(PlaylistCard);
