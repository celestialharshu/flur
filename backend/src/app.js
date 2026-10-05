import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import songRoutes from './routes/songRoutes.js';
import albumRoutes from './routes/albumRoutes.js';
import artistRoutes from './routes/artistRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import lyricsRoutes from './routes/lyricsRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

const app = express();

app.disable('x-powered-by');
// maxAge: browsers remember the CORS preflight, so the desktop app doesn't send an
// OPTIONS request before every API call (without it the browser's default is 5 seconds).
app.use(cors({ maxAge: 7200 }));
app.use(express.json({ limit: '100kb' }));

// Simple health-check route to confirm the server is up
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/search', searchRoutes);

// Unknown routes answer with JSON (the app expects JSON everywhere).
app.use((req, res) => {
  res.status(404).json({ error: 'Server route not found. The backend may need to be redeployed.' });
});

// Bad JSON bodies and anything a route forgot to catch.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('Unhandled error:', err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong.' : 'Invalid request.' });
});

export default app;
