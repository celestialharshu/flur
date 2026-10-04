import { useState } from 'react';
import { Music2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Signup({ onSwitchToLogin }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signup(name, email, password);
    } catch (err) {
      setError(err.message || 'Signup failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__card-side">
        <div className="auth-card">
          <h1 className="auth-card__title">Create your account</h1>
          <p className="auth-card__subtitle">Join Flur and start listening</p>

          <form onSubmit={handleSubmit} className="auth-card__form">
            <label className="auth-card__label">
              Name
              <input
                type="text"
                className="auth-card__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </label>

            <label className="auth-card__label">
              Email
              <input
                type="email"
                className="auth-card__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="auth-card__label">
              Password
              <input
                type="password"
                className="auth-card__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>

            {error && <p className="auth-card__error">{error}</p>}

            <button type="submit" className="auth-card__submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="auth-card__switch">
            Already have an account?{' '}
            <button className="auth-card__link" onClick={onSwitchToLogin}>
              Log in
            </button>
          </p>
        </div>
      </div>

      <div className="auth-page__visual-side">
        <div className="auth-visual">
          <span className="auth-visual__ring" />
          <span className="auth-visual__ring" />
          <span className="auth-visual__ring" />
          <div className="auth-visual__core">
            <Music2 size={32} color="#ffffff" />
          </div>
          <div className="auth-visual__bars">
            <span className="auth-visual__bar" />
            <span className="auth-visual__bar" />
            <span className="auth-visual__bar" />
            <span className="auth-visual__bar" />
            <span className="auth-visual__bar" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;