import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/database';

// Validation schemas
const aiConsentSchema = Joi.object({
  agreed: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must agree to the AI consent terms',
  }),
  digitalSignature: Joi.string().required().trim(),
});

const likenessConsentSchema = Joi.object({
  agreed: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must agree to the likeness rights terms',
  }),
  digitalSignature: Joi.string().required().trim(),
});

const guardianConsentSchema = Joi.object({
  guardianName: Joi.string().min(1).max(200).required().trim(),
  guardianEmail: Joi.string().email().required().trim(),
  guardianPhone: Joi.string().max(50).optional().trim(),
  relationship: Joi.string().min(1).max(100).required().trim(),
  agreed: Joi.boolean().valid(true).required().messages({
    'any.only': 'Guardian must agree to the consent terms',
  }),
  digitalSignature: Joi.string().required().trim(),
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

export class ConsentController {
  /**
   * GET /api/v1/consent
   * Get my consent status
   */
  static async getConsentStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const consent = await prisma.consent.findUnique({
        where: { userId: req.user.userId },
      });

      if (!consent) {
        res.status(200).json({
          success: true,
          data: {
            aiConsentSigned: false,
            likenessConsentSigned: false,
            guardianConsentSigned: false,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: consent,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/consent/ai
   * Sign AI consent agreement
   */
  static async signAiConsent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const body = validate(aiConsentSchema, req.body);

      const consent = await prisma.consent.upsert({
        where: { userId: req.user.userId },
        create: {
          userId: req.user.userId,
          aiConsentSigned: true,
          aiConsentSignedAt: new Date(),
          aiConsentSignature: body.digitalSignature,
        },
        update: {
          aiConsentSigned: true,
          aiConsentSignedAt: new Date(),
          aiConsentSignature: body.digitalSignature,
        },
      });

      res.status(200).json({
        success: true,
        data: consent,
        message: 'AI consent agreement signed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/consent/likeness
   * Sign likeness rights agreement
   */
  static async signLikenessConsent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const body = validate(likenessConsentSchema, req.body);

      const consent = await prisma.consent.upsert({
        where: { userId: req.user.userId },
        create: {
          userId: req.user.userId,
          likenessConsentSigned: true,
          likenessConsentSignedAt: new Date(),
          likenessConsentSignature: body.digitalSignature,
        },
        update: {
          likenessConsentSigned: true,
          likenessConsentSignedAt: new Date(),
          likenessConsentSignature: body.digitalSignature,
        },
      });

      res.status(200).json({
        success: true,
        data: consent,
        message: 'Likeness rights agreement signed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/consent/guardian
   * Submit guardian consent (for minors)
   */
  static async submitGuardianConsent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const body = validate(guardianConsentSchema, req.body);

      const consent = await prisma.consent.upsert({
        where: { userId: req.user.userId },
        create: {
          userId: req.user.userId,
          guardianConsentSigned: true,
          guardianConsentSignedAt: new Date(),
          guardianName: body.guardianName,
          guardianEmail: body.guardianEmail,
          guardianPhone: body.guardianPhone,
          relationship: body.relationship,
          guardianSignature: body.digitalSignature,
        },
        update: {
          guardianConsentSigned: true,
          guardianConsentSignedAt: new Date(),
          guardianName: body.guardianName,
          guardianEmail: body.guardianEmail,
          guardianPhone: body.guardianPhone,
          relationship: body.relationship,
          guardianSignature: body.digitalSignature,
        },
      });

      res.status(200).json({
        success: true,
        data: consent,
        message: 'Guardian consent submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/consent/verify/:userId
   * Verify consent status (admin/director)
   */
  static async verifyConsent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { userId } = req.params;
      const consent = await prisma.consent.findUnique({
        where: { userId },
      });

      if (!consent) {
        res.status(200).json({
          success: true,
          data: {
            userId,
            aiConsentSigned: false,
            likenessConsentSigned: false,
            guardianConsentSigned: false,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          userId,
          aiConsentSigned: consent.aiConsentSigned,
          likenessConsentSigned: consent.likenessConsentSigned,
          guardianConsentSigned: consent.guardianConsentSigned,
          aiConsentSignedAt: consent.aiConsentSignedAt,
          likenessConsentSignedAt: consent.likenessConsentSignedAt,
          guardianConsentSignedAt: consent.guardianConsentSignedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ConsentController;
