import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, getRecommendations);

export default router;