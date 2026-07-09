import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { SubscriptionTier } from '@prisma/client';

export class MasterCodeService {
  /**
   * Generate a random 8-character alphanumeric code
   */
  static generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitting I, O, 0, 1 to avoid confusion
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate a unique master code
   */
  static async generateUniqueCode(): Promise<string> {
    let code = this.generateCode();
    let existing = await prisma.masterCode.findUnique({ where: { code } });

    // Retry up to 10 times to avoid collisions
    let attempts = 0;
    while (existing && attempts < 10) {
      code = this.generateCode();
      existing = await prisma.masterCode.findUnique({ where: { code } });
      attempts++;
    }

    if (existing) {
      throw ApiError.internal('Failed to generate unique master code after multiple attempts');
    }

    return code;
  }

  /**
   * Create a new master code
   */
  static async createMasterCode(
    createdBy: string,
    tier: SubscriptionTier = 'FREE',
    maxUses: number = 1,
    expiresAt?: Date
  ) {
    const code = await this.generateUniqueCode();

    const masterCode = await prisma.masterCode.create({
      data: {
        code,
        tier,
        maxUses,
        expiresAt: expiresAt || null,
        createdBy,
      },
    });

    return masterCode;
  }

  /**
   * List master codes with optional filters
   */
  static async listMasterCodes(options: {
    status?: string;
    tier?: SubscriptionTier;
    page?: number;
    limit?: number;
  }) {
    const { status, tier, page = 1, limit = 20 } = options;

    const where: Record<string, unknown> = {};

    if (tier) {
      where.tier = tier;
    }

    if (status) {
      if (status === 'active') {
        where.revoked = false;
        where.OR = [
          { expiresAt: { gt: new Date() } },
          { expiresAt: null },
        ];
      } else if (status === 'revoked') {
        where.revoked = true;
      } else if (status === 'expired') {
        where.expiresAt = { lt: new Date() };
        where.revoked = false;
      }
    }

    const [codes, total] = await Promise.all([
      prisma.masterCode.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: { id: true, email: true },
          },
        },
      }),
      prisma.masterCode.count({ where }),
    ]);

    return {
      codes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single master code by ID
   */
  static async getMasterCodeById(id: string) {
    const code = await prisma.masterCode.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, email: true },
        },
      },
    });

    if (!code) {
      throw ApiError.notFound('Master code not found');
    }

    return code;
  }

  /**
   * Revoke a master code
   */
  static async revokeMasterCode(id: string) {
    const code = await prisma.masterCode.findUnique({ where: { id } });

    if (!code) {
      throw ApiError.notFound('Master code not found');
    }

    if (code.revoked) {
      throw ApiError.badRequest('Master code is already revoked');
    }

    const updated = await prisma.masterCode.update({
      where: { id },
      data: { revoked: true },
    });

    return updated;
  }

  /**
   * Validate a master code
   */
  static async validateCode(code: string): Promise<{ valid: boolean; tier: SubscriptionTier | null; message: string }> {
    const masterCode = await prisma.masterCode.findUnique({
      where: { code },
    });

    if (!masterCode) {
      return { valid: false, tier: null, message: 'Invalid master code' };
    }

    if (masterCode.revoked) {
      return { valid: false, tier: null, message: 'Master code has been revoked' };
    }

    if (masterCode.expiresAt && new Date() > masterCode.expiresAt) {
      return { valid: false, tier: null, message: 'Master code has expired' };
    }

    if (masterCode.usedCount >= masterCode.maxUses) {
      return { valid: false, tier: null, message: 'Master code has reached maximum uses' };
    }

    return { valid: true, tier: masterCode.tier, message: 'Master code is valid' };
  }

  /**
   * Extend the expiration of a master code
   */
  static async extendExpiration(id: string, newExpiresAt: Date) {
    const code = await prisma.masterCode.findUnique({ where: { id } });

    if (!code) {
      throw ApiError.notFound('Master code not found');
    }

    if (code.revoked) {
      throw ApiError.badRequest('Cannot extend a revoked master code');
    }

    const updated = await prisma.masterCode.update({
      where: { id },
      data: { expiresAt: newExpiresAt },
    });

    return updated;
  }
}

export default MasterCodeService;
