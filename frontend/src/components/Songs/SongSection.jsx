import { useRef } from 'react';
import { Play } from 'lucide-react';
import ScrollArrows from '../common/ScrollArrows';
import { SongCard, SongTile } from './SongCard';
import { usePlayer } from '../../context/PlayerContext';
import { useFavorites } from '../../context/FavoritesContext';

// layout: 'row'  -> horizontally scrolling square cards
//         'grid' -> two-column grid of compact tiles
function SongSection({ title, subtitle, songs = [], layout = 'row', emptyMessage }) {
  const scrollRef = useRef(null);
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();

  const scrollBy = (distance) => scrollRef.current?.scrollBy({ left: distance, behavior: 'smooth' });

  const handlePlay = (song) => {
    if (currentTrack?.id === song.id) togglePlay();
    else playTrack(song, songs);
  };

  const renderItem = (song) => {
    const Item = layout === 'grid' ? SongTile : SongCard;
    return (
      <Item
        key={song.id}
        song={song}
        isActive={currentTrack?.id === song.id}
        isPlaying={isPlaying}
        isFavorite={isFavorite(song.id)}
        onPlay={() => handlePlay(song)}
        onToggleFavorite={() => toggleFavorite(song.id)}
      />
    );
  };

  return (
    <section className="section">
      <div className="section__header">
        <div>
          <h2 className="section__title">{title}</h2>
          {subtitle && <p className="section__subtitle">{subtitle}</p>}
        </div>
        <div className="section__header-actions">
          {songs.length > 0 && (
            <button className="section__browse-link section__play-all" onClick={() => playTrack(songs[0], songs)}>
              <Play size={13} fill="currentColor" /> Play all
            </button>
          )}
          {layout === 'row' && songs.length > 0 && (
            <ScrollArrows onScrollLeft={() => scrollBy(-320)} onScrollRight={() => scrollBy(320)} />
          )}
        </div>
      </div>

      {songs.length === 0 ? (
        <p className="text-secondary section__empty">{emptyMessage}</p>
      ) : layout === 'grid' ? (
        <div className="song-grid">{songs.map(renderItem)}</div>
      ) : (
        <div className="scroll-row" ref={scrollRef}>{songs.map(renderItem)}</div>
      )}
    </section>
  );
}

export default SongSection;
