import { Prisma } from '@prisma/client';
import { Response, NextFunction } from 'express';
import Joi from 'joi';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { AuthenticatedRequest } from '../middleware/auth';
import { AiCreditCheckRequest } from '../middleware/aiCreditCheck';
import { ConsentCheckRequest } from '../middleware/consentCheck';
import * as aiService from '../services/aiService';

// ─── Validation Schemas ───────────────────────────────────────────────────

const generateSceneSchema = Joi.object({
  description: Joi.string().min(1).max(2000).required().trim(),
  genre: Joi.string().min(1).max(100).required().trim(),
  characterName: Joi.string().min(1).max(100).required().trim(),
  emotion: Joi.string().min(1).max(100).required().trim(),
});

const generateReelSchema = Joi.object({
  talentName: Joi.string().min(1).max(200).required().trim(),
  skills: Joi.array().items(Joi.string()).min(1).required(),
  clips: Joi.array().items(Joi.string()).min(1).required(),
  style: Joi.string().trim().optional(),
});

const generateMusicVideoSchema = Joi.object({
  audioFile: Joi.string().required().trim(),
  visualStyle: Joi.string().min(1).max(100).required().trim(),
  sceneDescriptions: Joi.array().items(Joi.string()).min(1).required(),
});

const generateDigitalTwinSchema = Joi.object({
  referencePhotos: Joi.array().items(Joi.string().uri()).min(1).required(),
  description: Joi.string().min(1).max(1000).required().trim(),
});

const enhanceSchema = Joi.object({
  fileUrl: Joi.string().uri().required().trim(),
});

const watermarkSchema = Joi.object({
  fileUrl: Joi.string().uri().required().trim(),
  watermarkText: Joi.string().min(1).max(200).optional().trim(),
});

const safetyCheckSchema = Joi.object({
  content: Joi.string().min(1).required().trim(),
});

const autoEditSchema = Joi.object({
  fileUrl: Joi.string().uri().required().trim(),
  targetDuration: Joi.number().integer().min(1).max(600).required(),
});

function validate<T>(schema: Joi.ObjectSchema<T>, data: unknown): T {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.reduce((acc, d) => {
      acc[d.path.join('.')] = d.message;
      return acc;
    }, {} as Record<string, string>);
    throw ApiError.badRequest('Validation failed', details);
  }
  return value;
}

/**
 * Helper to create an AiGeneration record and execute an AI pipeline.
 * Deducts credits, logs the generation, and returns a standardized response.
 */
async function runAiGeneration(
  req: AiCreditCheckRequest,
  type: 'SCENE' | 'REEL' | 'MUSIC_VIDEO' | 'DIGITAL_TWIN' | 'ENHANCEMENT',
  inputData: Record<string, unknown>,
  pipelineFn: () => Promise<Record<string, unknown>>
): Promise<{ generationId: string; status: string; creditsUsed: number; result: Record<string, unknown> }> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const tier = req.aiCredits?.tier || 'FREE';
  const creditsUsed = tier === 'GOLD' ? 0 : 1;

  // Create generation record
  const generation = await prisma.aiGeneration.create({
    data: {
      userId: req.user.userId,
      type,
      inputData: inputData as Prisma.InputJsonValue,
      costCredits: creditsUsed,
      status: 'PROCESSING',
    },
  });

  let result: Record<string, unknown>;
  let status: string;

  try {
    result = await pipelineFn();
    status = 'COMPLETED';

    // Update generation record
    await prisma.aiGeneration.update({
      where: { id: generation.id },
      data: {
        status: 'COMPLETED',
        outputUrl: (result.outputPath as string) || (result.videoPath as string) || (result.videoUrl as string) || null,
      },
    });
  } catch (err) {
    status = 'FAILED';
    await prisma.aiGeneration.update({
      where: { id: generation.id },
      data: {
        status: 'FAILED',
      },
    });
    throw err;
  }

  return { generationId: generation.id, status, creditsUsed, result };
}

// ─── Scene Generation ─────────────────────────────────────────────────────

export async function generateScene(
  req: AiCreditCheckRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = validate(generateSceneSchema, req.body);

    const { generationId, status, creditsUsed, result } = await runAiGeneration(
      req,
      'SCENE',
      body,
      () => aiService.generateScene(body)
    );

    res.status(200).json({
      success: true,
      data: {
        generationId,
        status,
        script: result.script || '',
        sceneImages: result.imageUrls || [],
        creditsUsed,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Reel Generation ──────────────────────────────────────────────────────

export async function generateReel(
  req: AiCreditCheckRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = validate(generateReelSchema, req.body);

    const { generationId, status, creditsUsed, result } = await runAiGeneration(
      req,
      'REEL',
      body,
      () => aiService.generateReel(body)
    );

    res.status(200).json({
      success: true,
      data: {
        generationId,
        status,
        reelUrl: result.videoPath || result.outputPath || '',
        creditsUsed,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Music Video Generation ───────────────────────────────────────────────

export async function generateMusicVideo(
  req: AiCreditCheckRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = validate(generateMusicVideoSchema, req.body);

    const { generationId, status, creditsUsed, result } = await runAiGeneration(
      req,
      'MUSIC_VIDEO',
      body,
      () => aiService.generateMusicVideo(body)
    );

    res.status(200).json({
      success: true,
      data: {
        generationId,
        status,
        videoUrl: result.videoPath || result.outputPath || '',
        creditsUsed,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Digital Twin Generation ──────────────────────────────────────────────

export async function generateDigitalTwin(
  req: AiCreditCheckRequest & ConsentCheckRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = validate(generateDigitalTwinSchema, req.body);

    // Check consent
    if (!req.consentSigned) {
      throw ApiError.forbidden('AI consent agreement required. Please sign the AI consent agreement before generating a digital twin.');
    }

    const { generationId, status, creditsUsed, result } = await runAiGeneration(
      req,
      'DIGITAL_TWIN',
      body,
      () => aiService.generateDigitalTwin(body)
    );

    // Also create/update DigitalTwin record
    if (req.user) {
      await prisma.digitalTwin.create({
        data: {
          talentId: req.user.userId,
          name: body.description.substring(0, 100),
          description: body.description,
          modelData: (result.modelData as Prisma.InputJsonValue) || {},
          consentSigned: true,
          consentSignedAt: new Date(),
          status: 'TRAINING',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        generationId,
        status,
        twinData: result,
        creditsUsed,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Auto Enhance ─────────────────────────────────────────────────────────

export async function autoEnhance(
  req: AiCreditCheckRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = validate(enhanceSchema, req.body);

    const { generationId, status, creditsUsed, result } = await runAiGeneration(
      req,
      'ENHANCEMENT',
      body,
      () => aiService.autoEnhance({ filePath: body.fileUrl })
    );

    res.status(200).json({
      success: true,
      data: {
        generationId,
        status,
        enhancedUrl: result.outputPath || '',
        creditsUsed,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Watermark ────────────────────────────────────────────────────────────

export async function watermarkMedia(
  req: AiCreditCheckRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = validate(watermarkSchema, req.body);

    const { generationId, status, creditsUsed, result } = await runAiGeneration(
      req,
      'ENHANCEMENT',
      body,
      () => aiService.watermark({ filePath: body.fileUrl, text: body.watermarkText })
    );

    res.status(200).json({
      success: true,
      data: {
        generationId,
        status,
        watermarkedUrl: result.outputPath || '',
        creditsUsed,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Safety Check ─────────────────────────────────────────────────────────

export async function safetyCheckContent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = validate(safetyCheckSchema, req.body);

    const isImageUrl = body.content.startsWith('http') && /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(body.content);
    const type = isImageUrl ? 'image' : 'text';

    const result = await aiService.safetyCheck({ content: body.content, type: type as 'text' | 'image' | 'auto' });

    res.status(200).json({
      success: true,
      data: {
        safe: result.safe ?? false,
        flags: result.flags || [],
        confidence: result.confidence ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Auto Edit ────────────────────────────────────────────────────────────

export async function autoEditVideo(
  req: AiCreditCheckRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = validate(autoEditSchema, req.body);

    const { generationId, status, creditsUsed, result } = await runAiGeneration(
      req,
      'ENHANCEMENT',
      body,
      () => aiService.autoEdit({ filePath: body.fileUrl, targetDuration: body.targetDuration })
    );

    res.status(200).json({
      success: true,
      data: {
        generationId,
        status,
        editedUrl: result.outputPath || '',
        creditsUsed,
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  generateScene,
  generateReel,
  generateMusicVideo,
  generateDigitalTwin,
  autoEnhance,
  watermarkMedia,
  safetyCheckContent,
  autoEditVideo,
};
