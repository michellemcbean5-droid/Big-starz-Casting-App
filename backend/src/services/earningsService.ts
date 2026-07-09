import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { EarningSource, EarningStatus } from '@prisma/client';

export class EarningsService {
  /**
   * Get earnings for a user with filters
   */
  static async getEarnings(userId: string, options: {
    startDate?: Date;
    endDate?: Date;
    source?: EarningSource;
    status?: EarningStatus;
    page?: number;
    limit?: number;
  }) {
    const { startDate, endDate, source, status, page = 1, limit = 20 } = options;

    const where: Record<string, unknown> = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = startDate;
      if (endDate) (where.createdAt as Record<string, unknown>).lte = endDate;
    }

    if (source) where.source = source;
    if (status) where.status = status;

    const [earnings, total] = await Promise.all([
      prisma.earning.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.earning.count({ where }),
    ]);

    return {
      earnings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get earnings summary for a user
   */
  static async getEarningsSummary(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalEarnings,
      thisMonthEarnings,
      pendingEarnings,
      paidEarnings,
      totalWithdrawn,
      totalFailedWithdrawals,
    ] = await Promise.all([
      // Total earnings
      prisma.earning.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      // This month earnings
      prisma.earning.aggregate({
        where: {
          userId,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      // Pending earnings
      prisma.earning.aggregate({
        where: { userId, status: 'PENDING' },
        _sum: { amount: true },
      }),
      // Paid earnings
      prisma.earning.aggregate({
        where: { userId, status: 'PAID' },
        _sum: { amount: true },
      }),
      // Total withdrawn (completed withdrawals)
      prisma.withdrawal.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      // Failed withdrawals
      prisma.withdrawal.aggregate({
        where: { userId, status: 'FAILED' },
        _sum: { amount: true },
      }),
    ]);

    const total = totalEarnings._sum.amount || 0;
    const thisMonth = thisMonthEarnings._sum.amount || 0;
    const pending = pendingEarnings._sum.amount || 0;
    const paid = paidEarnings._sum.amount || 0;
    const withdrawn = totalWithdrawn._sum.amount || 0;
    const failed = totalFailedWithdrawals._sum.amount || 0;

    const availableBalance = paid - withdrawn;

    return {
      total,
      thisMonth,
      pending,
      paid,
      withdrawn,
      failed,
      availableBalance: Math.max(0, availableBalance),
    };
  }

  /**
   * Request a withdrawal
   */
  static async requestWithdrawal(userId: string, amount: number, paymentMethod: string) {
    const MINIMUM_WITHDRAWAL = 10;

    if (amount < MINIMUM_WITHDRAWAL) {
      throw ApiError.badRequest(`Minimum withdrawal amount is $${MINIMUM_WITHDRAWAL}`);
    }

    const summary = await this.getEarningsSummary(userId);

    if (amount > summary.availableBalance) {
      throw ApiError.badRequest(
        `Insufficient balance. Available: $${summary.availableBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}`
      );
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        currency: 'USD',
        paymentMethod,
        status: 'PENDING',
      },
    });

    return withdrawal;
  }

  /**
   * Get withdrawal history
   */
  static async getWithdrawals(userId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.withdrawal.count({ where: { userId } }),
    ]);

    return {
      withdrawals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get earnings analytics by source
   */
  static async getAnalyticsBySource(userId: string) {
    const sources = Object.values(EarningSource);

    const results = await Promise.all(
      sources.map(async (source) => {
        const [total, count] = await Promise.all([
          prisma.earning.aggregate({
            where: { userId, source },
            _sum: { amount: true },
          }),
          prisma.earning.count({ where: { userId, source } }),
        ]);

        return {
          source,
          total: total._sum.amount || 0,
          count,
        };
      })
    );

    return results.filter((r) => r.total > 0 || r.count > 0);
  }

  /**
   * Get earnings analytics by month
   */
  static async getAnalyticsByMonth(userId: string) {
    const earnings = await prisma.earning.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyData = new Map<string, { month: string; total: number; count: number }>();

    for (const earning of earnings) {
      const date = new Date(earning.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(key)) {
        monthlyData.set(key, { month: key, total: 0, count: 0 });
      }

      const entry = monthlyData.get(key)!;
      entry.total += earning.amount;
      entry.count += 1;
    }

    return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
  }
}

export default EarningsService;
