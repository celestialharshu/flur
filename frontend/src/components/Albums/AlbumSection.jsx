import { useRef } from 'react';
import ScrollArrows from '../common/ScrollArrows';
import AlbumCard from './AlbumCard';

function AlbumSection({ title = 'Albums', albums = [] }) {
  const scrollRef = useRef(null);

  const scrollBy = (distance) => {
    scrollRef.current?.scrollBy({ left: distance, behavior: 'smooth' });
  };

  return (
    <section className="section">
      <div className="section__header">
        <h2 className="section__title">{title}</h2>
        <ScrollArrows
          onScrollLeft={() => scrollBy(-300)}
          onScrollRight={() => scrollBy(300)}
        />
      </div>

      <div className="scroll-row" ref={scrollRef}>
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            coverUrl={album.coverUrl}
            title={album.title}
            artist={album.artist}
          />
        ))}
      </div>
    </section>
  );
}

export default AlbumSection;