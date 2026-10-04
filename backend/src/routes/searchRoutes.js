import { Router } from 'express';
import { search } from '../controllers/searchController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', requireAuth, search);
export default router;
