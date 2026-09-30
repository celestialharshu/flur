import { Router } from 'express';
import { listArtists } from '../controllers/artistController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', requireAuth, listArtists);
export default router;