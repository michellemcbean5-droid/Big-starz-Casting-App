import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import {
  getCreditBalance,
  getUsageHistory,
  getTiers,
} from '../controllers/creditsController';

const router = Router();

// Credits balance and usage require authentication
// Tiers are public

router.get('/', authMiddleware, getCreditBalance);
router.get('/usage', authMiddleware, getUsageHistory);
router.get('/tiers', getTiers);

export default router;
