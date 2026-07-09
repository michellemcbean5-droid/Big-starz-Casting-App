import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import DMCAController from '../controllers/dmcaController';

const router = Router();

// POST /api/v1/dmca — Submit DMCA takedown request (public)
router.post('/', DMCAController.submitDMCA);

// GET /api/v1/dmca — List DMCA requests (admin only)
router.get('/', authMiddleware, requireAdmin, DMCAController.listDMCAs);

// GET /api/v1/dmca/:id — Get DMCA detail (admin/requester)
router.get('/:id', authMiddleware, DMCAController.getDMCAById);

// PUT /api/v1/dmca/:id/status — Update DMCA status (admin only)
router.put('/:id/status', authMiddleware, requireAdmin, DMCAController.updateDMCAStatus);

// POST /api/v1/dmca/:id/counter — Submit counter-notification
router.post('/:id/counter', authMiddleware, DMCAController.submitCounterNotification);

export default router;
