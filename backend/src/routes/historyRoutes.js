import { Router } from 'express';
import { addToHistory, listRecentlyPlayed } from '../controllers/historyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', requireAuth, addToHistory);
router.get('/recent', requireAuth, listRecentlyPlayed);

export default router;
