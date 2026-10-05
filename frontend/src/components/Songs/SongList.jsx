import { useState, useCallback } from 'react';
import SongRow from '../../pages/SongsRow';
import CreatePlaylistModal from '../Playlists/CreatePlaylistModal';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useFavorites } from '../../context/FavoritesContext';
import { usePlayer } from '../../context/PlayerContext';

// The list of song rows shared by the Songs, Search, Favorites, Album, Artist and
// Playlist pages (plus the "create playlist" popup they all need).
//   songs : the rows to show
//   queue : what becomes the play queue when a row is clicked (default: songs)
//   extra : optional (song) => node, placed next to each row (e.g. a remove button)
function SongList({ songs, queue, extra }) {
  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylists();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { currentTrack, playTrack } = usePlayer();
  const [pendingSongId, setPendingSongId] = useState(null);

  const list = queue || songs;
  const play = useCallback((song) => playTrack(song, list), [playTrack, list]);
  const activeId = currentTrack?.id;

  return (
    <>
      <div className="songs-page__list">
        {songs.map((song, i) => {
          const row = (
            <SongRow
              key={song.id}
              song={song}
              index={i + 1}
              isFavorite={favoriteIds.has(song.id)}
              isActive={activeId === song.id}
              onPlay={play}
              onToggleFavorite={toggleFavorite}
              playlists={playlists}
              onAddToPlaylist={addSongToPlaylist}
              onCreatePlaylist={setPendingSongId}
            />
          );
          return extra ? (
            <div key={song.id} className="playlist-detail__row">
              {row}
              {extra(song)}
            </div>
          ) : row;
        })}
      </div>

      {pendingSongId !== null && (
        <CreatePlaylistModal
          onConfirm={(title) => { createPlaylist(title, pendingSongId); setPendingSongId(null); }}
          onCancel={() => setPendingSongId(null)}
        />
      )}
    </>
  );
}

export default SongList;
