import { useState } from 'react';
import { Plus } from 'lucide-react';
import PlaylistCard from '../components/Playlists/PlaylistCard';
import CreatePlaylistModal from '../components/Playlists/CreatePlaylistModal';
import { usePlaylists } from '../context/PlaylistsContext';

function PlaylistsPage({ onOpenPlaylist }) {
  const { playlists, createPlaylist } = usePlaylists();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePlaylist = (title) => {
    createPlaylist(title);
    setIsCreating(false);
  };

  return (
    <div className="playlists-page">
      <div className="section__header">
        <h2 className="section__title">Playlists</h2>
        <button className="playlists-page__create-btn" onClick={() => setIsCreating(true)}>
          <Plus size={16} />
          Create Playlist
        </button>
      </div>

      <div className="playlists-page__grid">
        {playlists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            id={playlist.id}
            thumbnails={playlist.thumbnails}
            title={playlist.title}
            songCount={playlist.songIds.length}
            onOpen={onOpenPlaylist}
          />
        ))}
      </div>

      {isCreating && (
        <CreatePlaylistModal
          onConfirm={handleCreatePlaylist}
          onCancel={() => setIsCreating(false)}
        />
      )}
    </div>
  );
}

export default PlaylistsPage;
