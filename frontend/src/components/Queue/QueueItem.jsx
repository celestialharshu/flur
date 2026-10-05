import { memo } from 'react';

function QueueItem({ track, isActive = false, onPlay }) {
  return (
    <div
      className={`queue-item ${isActive ? 'queue-item--active' : ''}`}
      onClick={() => onPlay(track)}
    >
      <img src={track.thumbnail} alt="" className="queue-item__thumb" loading="lazy" decoding="async" />
      <div className="queue-item__info">
        <span className="queue-item__title">{track.title}</span>
        <span className="queue-item__artist">{track.artist}</span>
      </div>
      <span className="queue-item__duration">{track.duration}</span>
    </div>
  );
}

export default memo(QueueItem);
