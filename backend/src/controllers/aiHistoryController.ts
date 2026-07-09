import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { AuthenticatedRequest } from '../middleware/auth';

// ─── List Generation History ──────────────────────────────────────────────

export async function listGenerations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: req.user.userId };
    if (type) {
      where.type = type.toUpperCase();
    }
    if (status) {
      where.status = status.toUpperCase();
    }

    const [generations, total] = await Promise.all([
      prisma.aiGeneration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          status: true,
          inputData: true,
          outputUrl: true,
          costCredits: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.aiGeneration.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        generations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Get Single Generation ──────────────────────────────────────────────

export async function getGeneration(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { id } = req.params;

    const generation = await prisma.aiGeneration.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!generation) {
      throw ApiError.notFound('Generation not found');
    }

    res.status(200).json({
      success: true,
      data: generation,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Delete Generation (Soft Delete) ────────────────────────────────────

export async function deleteGeneration(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { id } = req.params;

    const generation = await prisma.aiGeneration.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!generation) {
      throw ApiError.notFound('Generation not found');
    }

    await prisma.aiGeneration.update({
      where: { id },
      data: { status: 'FAILED' },
    });

    res.status(200).json({
      success: true,
      message: 'Generation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export default {
  listGenerations,
  getGeneration,
  deleteGeneration,
};
