import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import ContractController from '../controllers/contractController';

const router = Router();

// GET /api/v1/contracts — List my contracts
router.get('/', authMiddleware, ContractController.listContracts);

// GET /api/v1/contracts/types — List available contract types (must be before /:id)
router.get('/types', authMiddleware, ContractController.listContractTypes);

// GET /api/v1/contracts/:id — Get contract detail
router.get('/:id', authMiddleware, ContractController.getContractById);

// POST /api/v1/contracts/:id/sign — Sign a contract
router.post('/:id/sign', authMiddleware, ContractController.signContract);

// POST /api/v1/contracts/:type/generate — Generate contract for user (admin only)
router.post('/:type/generate', authMiddleware, requireAdmin, ContractController.generateContract);

export default router;
