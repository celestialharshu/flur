import { Router } from 'express';
import { listAlbums, getAlbum } from '../controllers/albumController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', requireAuth, listAlbums);
router.get('/:id', requireAuth, getAlbum);
export default router;
