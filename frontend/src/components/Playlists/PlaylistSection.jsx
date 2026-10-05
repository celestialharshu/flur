import { useRef } from 'react';
import ScrollArrows from '../common/ScrollArrows';
import PlaylistCard from './PlaylistCard';

function PlaylistSection({ title = 'Playlists', playlists = [] }) {
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
        {playlists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            id={playlist.id}
            thumbnails={playlist.thumbnails}
            title={playlist.title}
            songCount={playlist.songCount ?? playlist.songIds?.length ?? 0}
          />
        ))}
      </div>
    </section>
  );
}

export default PlaylistSection;
