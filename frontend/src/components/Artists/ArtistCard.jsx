function ArtistCard({ avatarUrl, name }) {
  return (
    <div className="artist-card">
      <img src={avatarUrl} alt={name} className="artist-card__avatar" />
      <span className="artist-card__name">{name}</span>
    </div>
  );
}

export default ArtistCard;