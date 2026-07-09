import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/database';
import { DMCATakedownStatus } from '@prisma/client';

// Validation schemas
const createDMCASchema = Joi.object({
  requesterEmail: Joi.string().email().required().trim(),
  infringingUrl: Joi.string().uri().required().trim(),
  originalWorkUrl: Joi.string().uri().optional().trim(),
  description: Joi.string().max(2000).optional().trim(),
});

const updateDMCAStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'REVIEWING', 'REMOVED', 'REJECTED').required(),
  resolution: Joi.string().max(2000).optional().trim(),
});

const counterNotificationSchema = Joi.object({
  submitterEmail: Joi.string().email().required().trim(),
  submitterName: Joi.string().min(1).max(200).required().trim(),
  statement: Joi.string().min(1).max(5000).required().trim(),
  consentToJurisdiction: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must consent to jurisdiction',
  }),
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

export class DMCAController {
  /**
   * POST /api/v1/dmca
   * Submit DMCA takedown request
   */
  static async submitDMCA(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const body = validate(createDMCASchema, req.body);
      const takedown = await prisma.dMCATakedown.create({
        data: {
          requesterEmail: body.requesterEmail,
          infringingUrl: body.infringingUrl,
          originalWorkUrl: body.originalWorkUrl,
          description: body.description,
          status: 'PENDING',
        },
      });

      res.status(201).json({
        success: true,
        data: takedown,
        message: 'DMCA takedown request submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dmca
   * List DMCA requests (admin only)
   */
  static async listDMCAs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { status, page, limit } = req.query;
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const where: Record<string, unknown> = {};
      if (status) {
        where.status = status as DMCATakedownStatus;
      }

      const [takedowns, total] = await Promise.all([
        prisma.dMCATakedown.findMany({
          where,
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            counterNotifications: true,
          },
        }),
        prisma.dMCATakedown.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          takedowns,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dmca/:id
   * Get DMCA detail (admin/requester)
   */
  static async getDMCAById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { id } = req.params;
      const takedown = await prisma.dMCATakedown.findUnique({
        where: { id },
        include: {
          counterNotifications: true,
        },
      });

      if (!takedown) {
        throw ApiError.notFound('DMCA request not found');
      }

      res.status(200).json({
        success: true,
        data: takedown,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/dmca/:id/status
   * Update DMCA status (admin only)
   */
  static async updateDMCAStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { id } = req.params;
      const body = validate(updateDMCAStatusSchema, req.body);

      const takedown = await prisma.dMCATakedown.update({
        where: { id },
        data: {
          status: body.status as DMCATakedownStatus,
          resolution: body.resolution,
          resolvedAt: body.status === 'REMOVED' || body.status === 'REJECTED' ? new Date() : null,
        },
      });

      res.status(200).json({
        success: true,
        data: takedown,
        message: 'DMCA status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/dmca/:id/counter
   * Submit counter-notification
   */
  static async submitCounterNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { id } = req.params;
      const body = validate(counterNotificationSchema, req.body);

      // Verify the DMCA takedown exists
      const takedown = await prisma.dMCATakedown.findUnique({
        where: { id },
      });

      if (!takedown) {
        throw ApiError.notFound('DMCA takedown request not found');
      }

      const counter = await prisma.dMCACounterNotification.create({
        data: {
          dmcaTakedownId: id,
          submitterEmail: body.submitterEmail,
          submitterName: body.submitterName,
          statement: body.statement,
          consentToJurisdiction: body.consentToJurisdiction,
        },
      });

      res.status(201).json({
        success: true,
        data: counter,
        message: 'Counter-notification submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default DMCAController;
