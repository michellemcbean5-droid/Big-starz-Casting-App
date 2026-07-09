import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import SubscriptionService from '../services/subscriptionService';

// Validation schemas
const createSubscriptionSchema = Joi.object({
  planId: Joi.string().required(),
  paymentMethodId: Joi.string().required(),
});

const updateSubscriptionSchema = Joi.object({
  planId: Joi.string().required(),
});

const webhookSchema = Joi.object({
  type: Joi.string().required(),
  data: Joi.object().required(),
}).unknown(true);

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

export class SubscriptionController {
  /**
   * GET /api/v1/subscriptions/plans
   * List all subscription plans (public)
   */
  static async listPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await SubscriptionService.listPlans();
      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/subscriptions
   * Create new subscription
   */
  static async createSubscription(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const body = validate(createSubscriptionSchema, req.body);
      const result = await SubscriptionService.createSubscription(
        req.user.userId,
        body.planId,
        body.paymentMethodId
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/subscriptions
   * Get current subscription
   */
  static async getCurrentSubscription(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const subscription = await SubscriptionService.getCurrentSubscription(req.user.userId);

      if (!subscription) {
        res.status(200).json({
          success: true,
          data: null,
          message: 'No active subscription found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/subscriptions
   * Upgrade/downgrade subscription
   */
  static async updateSubscription(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const body = validate(updateSubscriptionSchema, req.body);
      const result = await SubscriptionService.updateSubscription(
        req.user.userId,
        body.planId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/subscriptions
   * Cancel subscription (set to expire at period end)
   */
  static async cancelSubscription(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const result = await SubscriptionService.cancelSubscription(req.user.userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/subscriptions/webhook
   * Stripe webhook handler
   */
  static async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const event = validate(webhookSchema, req.body);
      const result = await SubscriptionService.handleWebhook(event.type, event.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default SubscriptionController;
