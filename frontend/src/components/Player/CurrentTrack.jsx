import { Heart } from 'lucide-react';
import IconButton from '../common/IconButton';

function CurrentTrack({ thumbnail, title, artist, isFavorite = false, onToggleFavorite }) {
  return (
    <div className="current-track">
      <IconButton
        icon={<Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />}
        onClick={onToggleFavorite}
        active={isFavorite}
        size="sm"
        ariaLabel="Toggle favorite"
      />
      <img src={thumbnail} alt={title} className="current-track__thumb" />
      <div className="current-track__info">
        <span className="current-track__title">{title}</span>
        <span className="current-track__artist">{artist}</span>
      </div>
    </div>
  );
}

export default CurrentTrack;