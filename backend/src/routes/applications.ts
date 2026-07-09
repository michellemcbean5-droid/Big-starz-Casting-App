import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requireTalent, requireCastingDirector } from '../middleware/roleCheck';
import * as applicationController from '../controllers/applicationController';

const router = Router();

// ─── Talent Submit Application ──────────────────────────────────────────

router.post('/', authMiddleware, requireTalent, applicationController.submitApplication);

// ─── List Applications (role-aware in controller) ───────────────────────

router.get('/', authMiddleware, applicationController.listApplications);

// ─── Get Single Application ─────────────────────────────────────────────

router.get('/:id', authMiddleware, applicationController.getApplicationById);

// ─── Director Update Status ─────────────────────────────────────────────

router.put('/:id/status', authMiddleware, requireCastingDirector, applicationController.updateApplicationStatus);

// ─── Talent Withdraw Application ────────────────────────────────────────

router.delete('/:id', authMiddleware, requireTalent, applicationController.withdrawApplication);

export default router;
