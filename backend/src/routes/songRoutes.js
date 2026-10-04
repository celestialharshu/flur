import { Router } from 'express';
import { searchSongs, browseSongs, discoverMoreSongs } from '../controllers/songController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/search', requireAuth, searchSongs);
router.get('/browse', requireAuth, browseSongs);
router.get('/discover', requireAuth, discoverMoreSongs);

export default router;