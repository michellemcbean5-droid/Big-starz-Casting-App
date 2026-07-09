import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import EarningsController from '../controllers/earningsController';

const router = Router();

// GET /api/v1/earnings — Get my earnings with filters
router.get('/', authMiddleware, EarningsController.getEarnings);

// GET /api/v1/earnings/summary — Earnings summary
router.get('/summary', authMiddleware, EarningsController.getEarningsSummary);

// POST /api/v1/earnings/withdraw — Request withdrawal
router.post('/withdraw', authMiddleware, EarningsController.requestWithdrawal);

// GET /api/v1/earnings/withdrawals — Withdrawal history
router.get('/withdrawals', authMiddleware, EarningsController.getWithdrawals);

// GET /api/v1/earnings/analytics — Earnings analytics
router.get('/analytics', authMiddleware, EarningsController.getAnalytics);

export default router;
