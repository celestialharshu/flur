function QueueItem({ thumbnail, title, artist, duration, isActive = false, onClick }) {
  return (
    <div
      className={`queue-item ${isActive ? 'queue-item--active' : ''}`}
      onClick={onClick}
    >
      <img src={thumbnail} alt="" className="queue-item__thumb" />
      <div className="queue-item__info">
        <span className="queue-item__title">{title}</span>
        <span className="queue-item__artist">{artist}</span>
      </div>
      <span className="queue-item__duration">{duration}</span>
    </div>
  );
}

export default QueueItem;