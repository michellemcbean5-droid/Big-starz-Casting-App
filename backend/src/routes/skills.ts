import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import * as skillController from '../controllers/skillController';

const router = Router();

// Public Routes
router.get('/', skillController.listSkills);
router.get('/categories', skillController.listSkillCategories);
router.get('/:id', skillController.getSkillById);
router.get('/search', skillController.searchSkills);

// Authenticated Routes
router.get('/talent/:talentId', authMiddleware, skillController.getSkillsByTalent);
router.get('/casting-call/:callId', authMiddleware, skillController.getSkillsByCastingCall);

// Admin Only Routes
router.post('/', authMiddleware, requireAdmin, skillController.createSkill);
router.put('/:id', authMiddleware, requireAdmin, skillController.updateSkill);
router.delete('/:id', authMiddleware, requireAdmin, skillController.deleteSkill);
router.post('/talent-skill', authMiddleware, skillController.addTalentSkill);
router.delete('/talent-skill/:id', authMiddleware, skillController.removeTalentSkill);
router.post('/casting-call-skill', authMiddleware, requireAdmin, skillController.addCastingCallSkill);
router.delete('/casting-call-skill/:id', authMiddleware, requireAdmin, skillController.removeCastingCallSkill);

// Skill Matching Routes
router.post('/match/talent', authMiddleware, skillController.matchTalentToCastingCall);
router.post('/match/casting-call', authMiddleware, skillController.matchCastingCallToTalent);

export default router;
