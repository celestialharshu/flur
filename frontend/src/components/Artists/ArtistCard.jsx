function ArtistCard({ avatarUrl, name, onOpen }) {
  return (
    <div
      className={`artist-card ${onOpen ? 'artist-card--clickable' : ''}`}
      onClick={onOpen}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && e.key === 'Enter') onOpen(); }}
      title={name}
    >
      <img src={avatarUrl} alt={name} className="artist-card__avatar" />
      <span className="artist-card__name">{name}</span>
    </div>
  );
}

export default ArtistCard;
