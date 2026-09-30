import { useState } from 'react';
import { X } from 'lucide-react';

function CreatePlaylistModal({ onConfirm, onCancel }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onConfirm(trimmed);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Create playlist</h3>
          <button className="modal__close" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="modal__input"
            placeholder="Playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="modal__actions">
            <button type="button" className="modal__button modal__button--secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="modal__button modal__button--primary" disabled={!name.trim()}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePlaylistModal;