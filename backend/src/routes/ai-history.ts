import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import {
  listGenerations,
  getGeneration,
  deleteGeneration,
} from '../controllers/aiHistoryController';

const router = Router();

// All history routes require authentication

router.get('/', authMiddleware, listGenerations);
router.get('/:id', authMiddleware, getGeneration);
router.delete('/:id', authMiddleware, deleteGeneration);

export default router;
