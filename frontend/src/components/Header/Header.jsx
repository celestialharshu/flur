import { useState, useEffect, useRef } from 'react';
import SearchBar from './SearchBar';

function Header({ onSearch, onClearSearch }) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef(null);

  const handleChange = (value) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim() === '') {
      onClearSearch?.();
      return;
    }

    // Wait 400ms after the user stops typing before actually searching
    debounceRef.current = setTimeout(() => {
      onSearch?.(value.trim());
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleClear = () => {
    setQuery('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onClearSearch?.();
  };

  return (
    <div className="header">
      <SearchBar
        value={query}
        onChange={handleChange}
        onClear={handleClear}
      />
    </div>
  );
}

export default Header;