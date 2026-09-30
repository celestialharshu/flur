function PlaylistCard({ thumbnails = [], title, songCount, onClick }) {
  return (
    <div className="playlist-card" onClick={onClick}>
      <div className="playlist-card__collage">
        {thumbnails.slice(0, 4).map((thumb, i) => (
          <img
            key={i}
            src={thumb}
            alt=""
            className="playlist-card__thumb"
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

export default PlaylistCard;