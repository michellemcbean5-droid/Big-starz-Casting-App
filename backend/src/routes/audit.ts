import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import AuditController from '../controllers/auditController';

const router = Router();

// GET /api/v1/audit — List audit logs (admin only)
router.get('/', authMiddleware, requireAdmin, AuditController.listAuditLogs);

// GET /api/v1/audit/summary — Audit summary (admin only)
router.get('/summary', authMiddleware, requireAdmin, AuditController.getAuditSummary);

// POST /api/v1/audit/log — Create audit log (internal, used by middleware)
router.post('/log', AuditController.createAuditLog);

export default router;
