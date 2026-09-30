import { Router } from 'express';
import { listAlbums } from '../controllers/albumController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', requireAuth, listAlbums);
export default router;