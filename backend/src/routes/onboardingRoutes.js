import { Router } from 'express';
import { listGenres, submitOnboarding } from '../controllers/onboardingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/genres', listGenres); // public — needed before login too, for guest-facing genre list if ever shown
router.post('/complete', requireAuth, submitOnboarding); // requires login — ties preferences to a real user

export default router;