import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { onboardingApi } from '../api/backend';

function Onboarding({ onComplete }) {
  const { token } = useAuth();
  const [genres, setGenres] = useState([]);
  const [selected, setSelected] = useState([]); // ordered array of genre ids, in pick order
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    onboardingApi.getGenres()
      .then(({ genres }) => setGenres(genres))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleGenre = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((g) => g !== id);
      }
      if (prev.length >= 5) {
        return prev; // already at max, ignore further picks until one is deselected
      }
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    if (selected.length !== 5) return;
    setError('');
    setIsSubmitting(true);
    try {
      await onboardingApi.submit(token, selected);
      onComplete();
    } catch (err) {
      setError(err.message || 'Failed to save your picks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="onboarding-card">
        <h1 className="auth-card__title">Pick your top 5 genres</h1>
        <p className="auth-card__subtitle">
          This shapes what shows up in your Explorer and Songs tab. Pick in order — your first pick matters most.
        </p>

        {isLoading && <p className="text-secondary">Loading genres...</p>}

        {!isLoading && (
          <div className="onboarding-card__grid">
            {genres.map((genre) => {
              const rank = selected.indexOf(genre.id);
              const isSelected = rank !== -1;
              return (
                <button
                  key={genre.id}
                  className={`onboarding-genre ${isSelected ? 'onboarding-genre--selected' : ''}`}
                  onClick={() => toggleGenre(genre.id)}
                  disabled={!isSelected && selected.length >= 5}
                >
                  {isSelected && <span className="onboarding-genre__rank">{rank + 1}</span>}
                  <span className="onboarding-genre__name">{genre.name}</span>
                  {isSelected && <Check size={16} className="onboarding-genre__check" />}
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="auth-card__error">{error}</p>}

        <div className="onboarding-card__footer">
          <span className="text-secondary">{selected.length} / 5 selected</span>
          <button
            className="auth-card__submit"
            onClick={handleSubmit}
            disabled={selected.length !== 5 || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;