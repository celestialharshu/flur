import { Router } from 'express';
import { listFavorites, toggleFavorite } from '../controllers/favoriteController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listFavorites);
router.post('/:songId/toggle', requireAuth, toggleFavorite);

export default router;