import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requireRoles } from '../middleware/roleCheck';
import ConsentController from '../controllers/consentController';

const router = Router();

// GET /api/v1/consent — Get my consent status
router.get('/', authMiddleware, ConsentController.getConsentStatus);

// POST /api/v1/consent/ai — Sign AI consent agreement
router.post('/ai', authMiddleware, ConsentController.signAiConsent);

// POST /api/v1/consent/likeness — Sign likeness rights agreement
router.post('/likeness', authMiddleware, ConsentController.signLikenessConsent);

// POST /api/v1/consent/guardian — Submit guardian consent (for minors)
router.post('/guardian', authMiddleware, ConsentController.submitGuardianConsent);

// GET /api/v1/consent/verify/:userId — Verify consent status (admin/director)
router.get('/verify/:userId', authMiddleware, requireRoles('ADMIN', 'CASTING_DIRECTOR'), ConsentController.verifyConsent);

export default router;
