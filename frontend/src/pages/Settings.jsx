import { useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recommendationsApi } from '../api/backend';

const styles = {
  page: { maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  card: {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
  },
  cardTitle: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)',
    marginBottom: 'var(--space-md)',
  },
  profile: { display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 'var(--radius-circle)',
    background: 'var(--color-accent)',
    color: 'var(--color-text-on-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-bold)',
    objectFit: 'cover',
    flexShrink: 0,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 'var(--space-md)',
    padding: 'var(--space-sm) 0',
    borderTop: '1px solid var(--color-border-subtle)',
    fontSize: 'var(--font-size-md)',
  },
  label: { color: 'var(--color-text-secondary)' },
  desc: { color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-elevated)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-medium)',
    cursor: 'pointer',
  },
  btnDanger: { borderColor: 'var(--color-accent)', color: 'var(--color-accent)', background: 'transparent' },
};

function formatRole(role) {
  if (role === 'song_adder') return 'Song adder';
  return 'Listener';
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function Settings() {
  const { user, token, logout } = useAuth();
  const [status, setStatus] = useState(null); // { type: 'ok' | 'error', text }
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshRecommendations = async () => {
    setIsRefreshing(true);
    setStatus(null);
    try {
      await recommendationsApi.get(token, true);
      setStatus({ type: 'ok', text: 'Recommendations refreshed. Check the Explorer page.' });
    } catch (err) {
      setStatus({ type: 'error', text: `Couldn't refresh recommendations: ${err.message}` });
    } finally {
      setIsRefreshing(false);
    }
  };

  const initial = (user?.name || '?').charAt(0).toUpperCase();

  return (
    <div className="settings-page" style={styles.page}>
      <div className="section__header">
        <h2 className="section__title">Settings</h2>
      </div>

      <section style={styles.card}>
        <h3 style={styles.cardTitle}>Account</h3>
        <div style={styles.profile}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} style={styles.avatar} />
          ) : (
            <div style={styles.avatar}>{initial}</div>
          )}
          <div>
            <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-lg)' }}>
              {user?.name}
            </div>
            <div style={styles.label}>{user?.email}</div>
          </div>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Name</span>
          <span>{user?.name}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Email</span>
          <span>{user?.email}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Account type</span>
          <span>{formatRole(user?.role)}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Member since</span>
          <span>{formatDate(user?.created_at)}</span>
        </div>
      </section>

      <section style={styles.card}>
        <h3 style={styles.cardTitle}>Recommendations</h3>
        <p style={styles.desc}>
          Your Explorer suggestions are cached. Refresh them to get a new set based on your favorite genres.
        </p>
        <button style={styles.btn} onClick={handleRefreshRecommendations} disabled={isRefreshing}>
          <RefreshCw size={16} />
          {isRefreshing ? 'Refreshing...' : 'Refresh recommendations'}
        </button>
        {status && (
          <p
            style={{
              marginTop: 'var(--space-md)',
              fontSize: 'var(--font-size-sm)',
              color: status.type === 'error' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            }}
          >
            {status.text}
          </p>
        )}
      </section>

      <section style={styles.card}>
        <h3 style={styles.cardTitle}>Session</h3>
        <p style={styles.desc}>Sign out of Flur on this device.</p>
        <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={logout}>
          <LogOut size={16} />
          Log out
        </button>
      </section>
    </div>
  );
}

export default Settings;
