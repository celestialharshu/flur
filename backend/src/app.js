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

app.use(cors());
app.use(express.json());

// Simple health-check route to confirm the server is up
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/auth', authRoutes);
// Route mounting will happen here as we build each resource:
// app.use('/api/auth', authRoutes);
// app.use('/api/songs', songRoutes);
app.use('/api/recommendations', recommendationRoutes);
// etc.
app.use('/api/songs', songRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/search', searchRoutes);
export default app;