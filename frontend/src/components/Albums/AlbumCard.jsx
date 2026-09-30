function AlbumCard({ coverUrl, title, artist }) {
  return (
    <div className="album-card">
      <img src={coverUrl} alt={title} className="album-card__cover" />
      <span className="album-card__title">{title}</span>
      <span className="album-card__artist text-secondary">{artist}</span>
    </div>
  );
}

export default AlbumCard;