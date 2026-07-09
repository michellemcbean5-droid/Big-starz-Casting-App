import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

export interface AiCreditCheckRequest extends AuthenticatedRequest {
  aiCredits?: {
    tier: string;
    remaining: number;
    unlimited: boolean;
  };
}

const TIER_CREDITS: Record<string, number> = {
  FREE: 3,
  BRONZE: 25,
  SILVER: 100,
  GOLD: -1, // unlimited
};

/**
 * Middleware to check if the user has enough AI credits for the month.
 * Attaches `req.aiCredits` with tier info.
 * Returns 402 Payment Required if insufficient credits.
 */
export async function aiCreditCheckMiddleware(
  req: AiCreditCheckRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    // Get active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    const tier = subscription?.tier || 'FREE';
    const monthlyLimit = TIER_CREDITS[tier] ?? 3;

    // Unlimited tier (Gold)
    if (monthlyLimit === -1) {
      req.aiCredits = {
        tier,
        remaining: -1,
        unlimited: true,
      };
      next();
      return;
    }

    // Count current month's AI generations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usedThisMonth = await prisma.aiGeneration.count({
      where: {
        userId: req.user.userId,
        createdAt: {
          gte: startOfMonth,
        },
        status: {
          in: ['PENDING', 'PROCESSING', 'COMPLETED'],
        },
      },
    });

    const remaining = Math.max(0, monthlyLimit - usedThisMonth);

    req.aiCredits = {
      tier,
      remaining,
      unlimited: false,
    };

    if (remaining <= 0) {
      next(
        new ApiError(
          402,
          `AI credit limit reached for ${tier} tier. Upgrade to continue generating.`,
          true,
          { tier, monthlyLimit, usedThisMonth }
        )
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

export default aiCreditCheckMiddleware;
