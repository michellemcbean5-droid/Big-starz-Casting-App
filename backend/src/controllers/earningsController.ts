import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import EarningsService from '../services/earningsService';

// Validation schemas
const withdrawSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  paymentMethod: Joi.string().required().trim(),
});

const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  source: Joi.string().valid('AD_REVENUE', 'ENGAGEMENT', 'REFERRAL', 'CASTING_FEE').optional(),
  status: Joi.string().valid('PENDING', 'PAID', 'FAILED').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
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

export class EarningsController {
  /**
   * GET /api/v1/earnings
   * Get my earnings with filters
   */
  static async getEarnings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const filters = validate(dateRangeSchema, req.query);
      const result = await EarningsService.getEarnings(req.user.userId, {
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        source: filters.source,
        status: filters.status,
        page: filters.page,
        limit: filters.limit,
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
   * GET /api/v1/earnings/summary
   * Earnings summary
   */
  static async getEarningsSummary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const summary = await EarningsService.getEarningsSummary(req.user.userId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/earnings/withdraw
   * Request withdrawal
   */
  static async requestWithdrawal(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const body = validate(withdrawSchema, req.body);
      const withdrawal = await EarningsService.requestWithdrawal(
        req.user.userId,
        body.amount,
        body.paymentMethod
      );

      res.status(201).json({
        success: true,
        data: withdrawal,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/earnings/withdrawals
   * Withdrawal history
   */
  static async getWithdrawals(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await EarningsService.getWithdrawals(req.user.userId, { page, limit });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/earnings/analytics
   * Earnings analytics
   */
  static async getAnalytics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const bySource = await EarningsService.getAnalyticsBySource(req.user.userId);
      const byMonth = await EarningsService.getAnalyticsByMonth(req.user.userId);

      res.status(200).json({
        success: true,
        data: {
          bySource,
          byMonth,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default EarningsController;
