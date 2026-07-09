import { Response, NextFunction } from 'express';
import Joi from 'joi';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { AuthenticatedRequest } from '../middleware/auth';

// ─── Validation Schemas ─────────────────────────────────────────────────

const updateDigitalTwinSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional().trim(),
  description: Joi.string().min(1).max(2000).optional().trim(),
}).min(1);

const signConsentSchema = Joi.object({
  consent: Joi.boolean().valid(true).required().messages({
    'any.only': 'Consent must be explicitly set to true',
  }),
  ipAddress: Joi.string().ip().optional(),
  userAgent: Joi.string().optional(),
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

// ─── List Digital Twins ───────────────────────────────────────────────────

export async function listDigitalTwins(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const twins = await prisma.digitalTwin.findMany({
      where: { talentId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnailUrl: true,
        consentSigned: true,
        consentSignedAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: twins,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Get Single Digital Twin ────────────────────────────────────────────

export async function getDigitalTwin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { id } = req.params;

    const twin = await prisma.digitalTwin.findFirst({
      where: {
        id,
        talentId: req.user.userId,
      },
    });

    if (!twin) {
      throw ApiError.notFound('Digital twin not found');
    }

    res.status(200).json({
      success: true,
      data: twin,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Update Digital Twin ────────────────────────────────────────────────

export async function updateDigitalTwin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { id } = req.params;
    const body = validate(updateDigitalTwinSchema, req.body);

    const existing = await prisma.digitalTwin.findFirst({
      where: {
        id,
        talentId: req.user.userId,
      },
    });

    if (!existing) {
      throw ApiError.notFound('Digital twin not found');
    }

    const twin = await prisma.digitalTwin.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      data: twin,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Delete Digital Twin ────────────────────────────────────────────────

export async function deleteDigitalTwin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { id } = req.params;

    const existing = await prisma.digitalTwin.findFirst({
      where: {
        id,
        talentId: req.user.userId,
      },
    });

    if (!existing) {
      throw ApiError.notFound('Digital twin not found');
    }

    await prisma.digitalTwin.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Digital twin deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

// ─── Sign/Update Consent ────────────────────────────────────────────────

export async function signConsent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { id } = req.params;
    const body = validate(signConsentSchema, req.body);

    const existing = await prisma.digitalTwin.findFirst({
      where: {
        id,
        talentId: req.user.userId,
      },
    });

    if (!existing) {
      throw ApiError.notFound('Digital twin not found');
    }

    // Update digital twin consent
    const twin = await prisma.digitalTwin.update({
      where: { id },
      data: {
        consentSigned: true,
        consentSignedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Also create/update AI consent contract
    await prisma.contract.upsert({
      where: {
        id: `${req.user.userId}_ai_consent`,
      },
      create: {
        id: `${req.user.userId}_ai_consent`,
        userId: req.user.userId,
        type: 'AI_CONSENT',
        content: 'AI consent agreement for digital twin and AI generation features.',
        signedAt: new Date(),
        ipAddress: body.ipAddress || req.ip || '',
        userAgent: body.userAgent || req.headers['user-agent'] || '',
        status: 'SIGNED',
      },
      update: {
        signedAt: new Date(),
        ipAddress: body.ipAddress || req.ip || '',
        userAgent: body.userAgent || req.headers['user-agent'] || '',
        status: 'SIGNED',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        twin,
        consentSigned: true,
        signedAt: twin.consentSignedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Get Usage Analytics ────────────────────────────────────────────────

export async function getUsageAnalytics(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { id } = req.params;

    const existing = await prisma.digitalTwin.findFirst({
      where: {
        id,
        talentId: req.user.userId,
      },
    });

    if (!existing) {
      throw ApiError.notFound('Digital twin not found');
    }

    // Count AI generations that reference this digital twin
    const generationCount = await prisma.aiGeneration.count({
      where: {
        userId: req.user.userId,
        type: 'DIGITAL_TWIN',
        inputData: {
          path: ['description'],
          string_contains: existing.description || '',
        },
      },
    });

    // Total AI generations by the user
    const totalGenerations = await prisma.aiGeneration.count({
      where: {
        userId: req.user.userId,
      },
    });

    // Recent generations
    const recentGenerations = await prisma.aiGeneration.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        status: true,
        costCredits: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        twinId: id,
        generationCount,
        totalGenerations,
        recentGenerations,
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  listDigitalTwins,
  getDigitalTwin,
  updateDigitalTwin,
  deleteDigitalTwin,
  signConsent,
  getUsageAnalytics,
};
