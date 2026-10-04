import { useState } from 'react';
import { Music2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Login({ onSwitchToSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__card-side">
        <div className="auth-card">
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__subtitle">Log in to Flur to continue</p>

          <form onSubmit={handleSubmit} className="auth-card__form">
            <label className="auth-card__label">
              Email
              <input
                type="email"
                className="auth-card__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
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
              />
            </label>

            {error && <p className="auth-card__error">{error}</p>}

            <button type="submit" className="auth-card__submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="auth-card__switch">
            Don't have an account?{' '}
            <button className="auth-card__link" onClick={onSwitchToSignup}>
              Sign up
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

export default Login;