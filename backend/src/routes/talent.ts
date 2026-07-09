import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import * as talentController from '../controllers/talentController';

const router = Router();

// ─── Public Routes ──────────────────────────────────────────────────────

router.get('/', talentController.listTalentProfiles);
router.get('/:id', talentController.getTalentProfileById);
router.get('/:id/digital-twin', talentController.getDigitalTwinInfo);

// ─── Admin Only ─────────────────────────────────────────────────────────

router.post('/:id/rank', authMiddleware, requireAdmin, talentController.updateRankingScore);

export default router;
