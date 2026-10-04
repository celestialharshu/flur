import { Search, X } from 'lucide-react';

function SearchBar({ value, onChange, onClear, onSubmit }) {
  return (
    <div className="search-bar">
      <Search size={16} className="search-bar__icon" />
      <input
        type="text"
        className="search-bar__input"
        placeholder="Search songs, artists, albums, playlists..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit?.(); }}
      />
      {value && (
        <button className="search-bar__clear" onClick={onClear} aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;