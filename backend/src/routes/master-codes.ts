import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import MasterCodeController from '../controllers/masterCodeController';

const router = Router();

// POST /api/v1/master-codes — Generate new master code (admin only)
router.post('/', authMiddleware, requireAdmin, MasterCodeController.createMasterCode);

// GET /api/v1/master-codes — List all master codes (admin only)
router.get('/', authMiddleware, requireAdmin, MasterCodeController.listMasterCodes);

// POST /api/v1/master-codes/validate — Validate a code (public, must be before /:id)
router.post('/validate', MasterCodeController.validateCode);

// GET /api/v1/master-codes/:id — Get code detail (admin only)
router.get('/:id', authMiddleware, requireAdmin, MasterCodeController.getMasterCodeById);

// DELETE /api/v1/master-codes/:id — Revoke code (admin only)
router.delete('/:id', authMiddleware, requireAdmin, MasterCodeController.revokeMasterCode);

// POST /api/v1/master-codes/:id/extend — Extend expiration (admin only)
router.post('/:id/extend', authMiddleware, requireAdmin, MasterCodeController.extendMasterCode);

export default router;
