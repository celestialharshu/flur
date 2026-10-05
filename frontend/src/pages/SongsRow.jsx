import { memo } from 'react';
import { Heart, MoreVertical, ListPlus, Plus, Check } from 'lucide-react';
import IconButton from '../components/common/IconButton';
import DropdownMenu from '../components/common/DropdownMenu';

const NONE = [];

// One row of a song list. Handlers are shared by all rows (they receive the song / id),
// so a row only re-renders when its own song, favorite or active state changes.
function SongRow({
  song,
  index,
  isFavorite = false,
  isActive = false,
  onPlay,
  onToggleFavorite,
  playlists = NONE,
  onAddToPlaylist,
  onCreatePlaylist,
}) {
  const { id, thumbnail, title, artist, album, duration } = song;

  return (
    <div className={`song-row ${isActive ? 'song-row--active' : ''}`} onClick={() => onPlay(song)}>
      <span className="song-row__index">{index}</span>

      <img src={thumbnail} alt={title} className="song-row__thumb" loading="lazy" decoding="async" />

      <div className="song-row__info">
        <span className="song-row__title">{title}</span>
        <span className="song-row__artist">{artist}</span>
      </div>

      <span className="song-row__album">{album}</span>

      <IconButton
        icon={<Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(id);
        }}
        active={isFavorite}
        size="sm"
        ariaLabel="Toggle favorite"
      />

      <span className="song-row__duration">{duration}</span>

      <DropdownMenu
        align="right"
        trigger={
          <IconButton
            icon={<MoreVertical size={16} />}
            size="sm"
            ariaLabel="More options"
          />
        }
      >
        {({ close }) => (
          <>
            <div className="dropdown-menu__label">Add to playlist</div>

            {playlists.map((playlist) => {
              const alreadyAdded = playlist.songIds?.includes(id);
              return (
                <button
                  key={playlist.id}
                  className="dropdown-menu__item"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToPlaylist?.(playlist.id, id);
                    close();
                  }}
                >
                  {alreadyAdded ? <Check size={14} /> : <ListPlus size={14} />}
                  {playlist.title}
                </button>
              );
            })}

            <div className="dropdown-menu__divider" />

            <button
              className="dropdown-menu__item"
              onClick={(e) => {
                e.stopPropagation();
                onCreatePlaylist?.(id);
                close();
              }}
            >
              <Plus size={14} />
              Create new playlist
            </button>
          </>
        )}
      </DropdownMenu>
    </div>
  );
}

export default memo(SongRow);
