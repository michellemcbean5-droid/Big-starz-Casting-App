import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { AuthenticatedRequest } from '../middleware/auth';

const TIER_CONFIG = [
  {
    name: 'FREE',
    price: 0,
    aiCredits: 3,
    features: [
      '3 AI generations per month',
      'Basic profile',
      'Master code required',
    ],
  },
  {
    name: 'BRONZE',
    price: 9.99,
    aiCredits: 25,
    features: [
      '25 AI generations per month',
      'Priority listing',
      'Basic analytics',
    ],
  },
  {
    name: 'SILVER',
    price: 29.99,
    aiCredits: 100,
    features: [
      '100 AI generations per month',
      'Featured profile',
      'Advanced analytics',
      'Digital twin generation',
    ],
  },
  {
    name: 'GOLD',
    price: 99.99,
    aiCredits: -1, // unlimited
    features: [
      'Unlimited AI generations',
      'Premium placement',
      'Direct casting director contact',
      'Revenue share',
      'All digital twin features',
    ],
  },
];

// ─── Get Current AI Credit Balance ────────────────────────────────────────

export async function getCreditBalance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    const tier = subscription?.tier || 'FREE';
    const monthlyLimit = TIER_CONFIG.find((t) => t.name === tier)?.aiCredits ?? 3;

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

    const remaining = monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - usedThisMonth);
    const unlimited = monthlyLimit === -1;

    res.status(200).json({
      success: true,
      data: {
        tier,
        monthlyLimit: monthlyLimit === -1 ? 'unlimited' : monthlyLimit,
        usedThisMonth,
        remaining: unlimited ? 'unlimited' : remaining,
        unlimited,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Get AI Usage History (Monthly Breakdown) ───────────────────────────

export async function getUsageHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const months = parseInt(req.query.months as string || '6', 10);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const generations = await prisma.aiGeneration.findMany({
      where: {
        userId: req.user.userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        type: true,
        costCredits: true,
        createdAt: true,
      },
    });

    // Group by month
    const monthlyBreakdown: Record<string, { totalCredits: number; generations: number; byType: Record<string, number> }> = {};

    for (const gen of generations) {
      const monthKey = `${gen.createdAt.getFullYear()}-${String(gen.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = { totalCredits: 0, generations: 0, byType: {} };
      }
      monthlyBreakdown[monthKey].totalCredits += gen.costCredits;
      monthlyBreakdown[monthKey].generations += 1;
      monthlyBreakdown[monthKey].byType[gen.type] = (monthlyBreakdown[monthKey].byType[gen.type] || 0) + 1;
    }

    // Fill in empty months
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = { totalCredits: 0, generations: 0, byType: {} };
      }
    }

    const sortedMonths = Object.keys(monthlyBreakdown).sort();

    res.status(200).json({
      success: true,
      data: {
        history: sortedMonths.map((month) => ({
          month,
          ...monthlyBreakdown[month],
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Get Tier Pricing and Limits ────────────────────────────────────────

export async function getTiers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      data: {
        tiers: TIER_CONFIG,
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getCreditBalance,
  getUsageHistory,
  getTiers,
};
