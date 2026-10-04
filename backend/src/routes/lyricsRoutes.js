import { Router } from 'express';
import { fetchLyrics } from '../controllers/lyricsController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', requireAuth, fetchLyrics);
export default router;
