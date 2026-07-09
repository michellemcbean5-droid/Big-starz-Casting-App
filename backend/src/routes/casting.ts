import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requireCastingDirector } from '../middleware/roleCheck';
import * as castingController from '../controllers/castingController';

const router = Router();

// ─── Public Routes ──────────────────────────────────────────────────────

router.get('/', castingController.listCastingCalls);
router.get('/:id', castingController.getCastingCallById);

// ─── Protected Routes — Casting Director Only ───────────────────────────

router.post('/', authMiddleware, requireCastingDirector, castingController.createCastingCall);
router.put('/:id', authMiddleware, requireCastingDirector, castingController.updateCastingCall);
router.delete('/:id', authMiddleware, requireCastingDirector, castingController.deleteCastingCall);
router.get('/:id/applications', authMiddleware, requireCastingDirector, castingController.getApplicationsForCastingCall);
router.post('/:id/close', authMiddleware, requireCastingDirector, castingController.closeCastingCall);
router.post('/:id/fill', authMiddleware, requireCastingDirector, castingController.fillCastingCall);

export default router;
