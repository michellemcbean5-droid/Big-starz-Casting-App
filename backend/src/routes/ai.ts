import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import aiCreditCheckMiddleware from '../middleware/aiCreditCheck';
import consentCheckMiddleware from '../middleware/consentCheck';
import {
  generateScene,
  generateReel,
  generateMusicVideo,
  generateDigitalTwin,
  autoEnhance,
  watermarkMedia,
  safetyCheckContent,
  autoEditVideo,
} from '../controllers/aiController';

const router = Router();

// All AI routes require authentication and credit check
// Consent check is added only for digital twin generation

router.post(
  '/generate/scene',
  authMiddleware,
  aiCreditCheckMiddleware,
  generateScene
);

router.post(
  '/generate/reel',
  authMiddleware,
  aiCreditCheckMiddleware,
  generateReel
);

router.post(
  '/generate/music-video',
  authMiddleware,
  aiCreditCheckMiddleware,
  generateMusicVideo
);

router.post(
  '/generate/digital-twin',
  authMiddleware,
  aiCreditCheckMiddleware,
  consentCheckMiddleware,
  generateDigitalTwin
);

router.post(
  '/enhance',
  authMiddleware,
  aiCreditCheckMiddleware,
  autoEnhance
);

router.post(
  '/watermark',
  authMiddleware,
  aiCreditCheckMiddleware,
  watermarkMedia
);

router.post(
  '/safety-check',
  authMiddleware,
  safetyCheckContent
);

router.post(
  '/auto-edit',
  authMiddleware,
  aiCreditCheckMiddleware,
  autoEditVideo
);

export default router;
