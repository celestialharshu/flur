import { Router } from 'express';
import { searchSongs } from '../controllers/songController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/search', requireAuth, searchSongs);

export default router;