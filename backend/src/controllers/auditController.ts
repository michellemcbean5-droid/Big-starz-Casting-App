import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/database';

export class AuditController {
  /**
   * GET /api/v1/audit
   * List audit logs (admin only)
   */
  static async listAuditLogs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { userId, action, entityType, entityId, startDate, endDate, page, limit } = req.query;
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 50;

      const where: Record<string, unknown> = {};

      if (userId) where.userId = userId as string;
      if (action) where.action = { contains: action as string, mode: 'insensitive' };
      if (entityType) where.entityType = { contains: entityType as string, mode: 'insensitive' };
      if (entityId) where.entityId = entityId as string;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate as string);
        if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate as string);
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          logs,
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
   * GET /api/v1/audit/summary
   * Audit summary (actions by type, by user)
   */
  static async getAuditSummary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { startDate, endDate } = req.query;
      const where: Record<string, unknown> = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate as string);
        if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate as string);
      }

      // Actions by type
      const actionsByType = await prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      });

      // Actions by entity type
      const actionsByEntityType = await prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: { entityType: true },
      });

      // Actions by user (top 10)
      const actionsByUser = await prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      });

      // Total count
      const totalCount = await prisma.auditLog.count({ where });

      res.status(200).json({
        success: true,
        data: {
          totalCount,
          actionsByType: actionsByType.map((a) => ({
            action: a.action,
            count: a._count.action,
          })),
          actionsByEntityType: actionsByEntityType.map((e) => ({
            entityType: e.entityType,
            count: e._count.entityType,
          })),
          actionsByUser: actionsByUser.map((u) => ({
            userId: u.userId,
            count: u._count.userId,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/audit/log
   * Create audit log (internal, used by middleware)
   */
  static async createAuditLog(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, action, entityType, entityId, metadata, ipAddress } = req.body;

      const log = await prisma.auditLog.create({
        data: {
          userId: userId || null,
          action,
          entityType,
          entityId: entityId || null,
          metadata: metadata || null,
          ipAddress: ipAddress || null,
        },
      });

      res.status(201).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuditController;
