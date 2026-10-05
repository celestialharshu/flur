import { useState, useEffect, useRef, useCallback, memo } from 'react';
import SearchBar from './SearchBar';

const DEBOUNCE_MS = 350;

function Header({ onSearch, onClearSearch }) {
  const [query, setQuery] = useState('');
  const latest = useRef(''); // what is in the box right now (for Enter)
  const timer = useRef(null);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  const handleChange = useCallback((value) => {
    latest.current = value;
    setQuery(value);
    cancel();

    if (value.trim() === '') {
      onClearSearch?.();
      return;
    }

    // Wait until the user stops typing before actually searching
    timer.current = setTimeout(() => onSearch?.(value.trim()), DEBOUNCE_MS);
  }, [onSearch, onClearSearch]);

  useEffect(() => cancel, []);

  // Enter = search right now, skip the debounce wait
  const handleSubmit = useCallback(() => {
    cancel();
    if (latest.current.trim()) onSearch?.(latest.current.trim());
  }, [onSearch]);

  const handleClear = useCallback(() => {
    latest.current = '';
    setQuery('');
    cancel();
    onClearSearch?.();
  }, [onClearSearch]);

  return (
    <div className="header">
      <SearchBar
        value={query}
        onChange={handleChange}
        onClear={handleClear}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default memo(Header);
