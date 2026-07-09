import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import {
  listDigitalTwins,
  getDigitalTwin,
  updateDigitalTwin,
  deleteDigitalTwin,
  signConsent,
  getUsageAnalytics,
} from '../controllers/digitalTwinController';

const router = Router();

// All digital twin routes require authentication

router.get('/', authMiddleware, listDigitalTwins);
router.get('/:id', authMiddleware, getDigitalTwin);
router.put('/:id', authMiddleware, updateDigitalTwin);
router.delete('/:id', authMiddleware, deleteDigitalTwin);
router.post('/:id/consent', authMiddleware, signConsent);
router.get('/:id/usage', authMiddleware, getUsageAnalytics);

export default router;
