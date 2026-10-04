import { Router } from 'express';
import { listArtists, getArtist } from '../controllers/artistController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', requireAuth, listArtists);
router.get('/:id', requireAuth, getArtist);
export default router;
