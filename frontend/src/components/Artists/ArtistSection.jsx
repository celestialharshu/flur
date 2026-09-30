import { useRef } from 'react';
import ScrollArrows from '../common/ScrollArrows';
import ArtistCard from './ArtistCard';

function ArtistSection({ title = 'Artists', artists = [], onBrowse }) {
  const scrollRef = useRef(null);

  const scrollBy = (distance) => {
    scrollRef.current?.scrollBy({ left: distance, behavior: 'smooth' });
  };

  return (
    <section className="section">
      <div className="section__header">
        <h2 className="section__title">{title}</h2>
        <div className="section__header-actions">
          <button className="section__browse-link" onClick={onBrowse}>
            Browse
          </button>
          <ScrollArrows
            onScrollLeft={() => scrollBy(-300)}
            onScrollRight={() => scrollBy(300)}
          />
        </div>
      </div>

      <div className="scroll-row" ref={scrollRef}>
        {artists.map((artist) => (
          <ArtistCard
            key={artist.id}
            avatarUrl={artist.avatarUrl}
            name={artist.name}
          />
        ))}
      </div>
    </section>
  );
}

export default ArtistSection;