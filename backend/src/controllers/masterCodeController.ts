import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import MasterCodeService from '../services/masterCodeService';
import { SubscriptionTier } from '@prisma/client';

// Validation schemas
const createMasterCodeSchema = Joi.object({
  tier: Joi.string().valid('FREE', 'BRONZE', 'SILVER', 'GOLD').default('FREE'),
  maxUses: Joi.number().integer().min(1).max(10000).default(1),
  expiresAt: Joi.date().iso().optional(),
});

const extendCodeSchema = Joi.object({
  expiresAt: Joi.date().iso().required(),
});

const validateCodeSchema = Joi.object({
  code: Joi.string().required().trim().length(8).uppercase(),
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

export class MasterCodeController {
  /**
   * POST /api/v1/master-codes
   * Generate new master code (admin only)
   */
  static async createMasterCode(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const body = validate(createMasterCodeSchema, req.body);
      const masterCode = await MasterCodeService.createMasterCode(
        req.user.userId,
        body.tier as SubscriptionTier,
        body.maxUses,
        body.expiresAt ? new Date(body.expiresAt) : undefined
      );

      res.status(201).json({
        success: true,
        data: masterCode,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/master-codes
   * List all master codes (admin only)
   */
  static async listMasterCodes(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { status, tier, page, limit } = req.query;

      const result = await MasterCodeService.listMasterCodes({
        status: status as string | undefined,
        tier: tier as SubscriptionTier | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/master-codes/:id
   * Get code detail (admin only)
   */
  static async getMasterCodeById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { id } = req.params;
      const masterCode = await MasterCodeService.getMasterCodeById(id);

      res.status(200).json({
        success: true,
        data: masterCode,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/master-codes/:id
   * Revoke code (admin only)
   */
  static async revokeMasterCode(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { id } = req.params;
      const masterCode = await MasterCodeService.revokeMasterCode(id);

      res.status(200).json({
        success: true,
        data: masterCode,
        message: 'Master code revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/master-codes/validate
   * Validate a code (public)
   */
  static async validateCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const body = validate(validateCodeSchema, req.body);
      const result = await MasterCodeService.validateCode(body.code.toUpperCase());

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/master-codes/:id/extend
   * Extend expiration (admin only)
   */
  static async extendMasterCode(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { id } = req.params;
      const body = validate(extendCodeSchema, req.body);
      const masterCode = await MasterCodeService.extendExpiration(id, new Date(body.expiresAt));

      res.status(200).json({
        success: true,
        data: masterCode,
        message: 'Master code expiration extended successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default MasterCodeController;
