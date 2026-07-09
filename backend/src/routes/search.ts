import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as searchController from '../controllers/searchController';

const router = Router();

// ─── Public Unified Search ────────────────────────────────────────────

router.get('/', searchController.unifiedSearch);

// ─── Protected Matching & Recommendations ───────────────────────────────

router.post('/match', authMiddleware, searchController.autoMatch);
router.get('/recommendations', authMiddleware, searchController.getRecommendations);

export default router;
