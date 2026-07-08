import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokenPair, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import authMiddleware, { AuthenticatedRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// ─── Validation Schemas ─────────────────────────────────────────────────

const registerSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
  firstName: Joi.string().min(1).max(100).required().trim(),
  lastName: Joi.string().min(1).max(100).required().trim(),
  role: Joi.string().valid('TALENT', 'CASTING_DIRECTOR', 'CREATOR').default('TALENT'),
  masterCode: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional().trim(),
  lastName: Joi.string().min(1).max(100).optional().trim(),
  displayName: Joi.string().min(1).max(100).optional().trim(),
  avatarUrl: Joi.string().uri().optional().allow(''),
  bio: Joi.string().max(2000).optional(),
  location: Joi.string().max(200).optional().trim(),
  phone: Joi.string().max(50).optional().trim(),
});

// ─── Helper: Validate Request Body ──────────────────────────────────────

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

// ─── Routes ─────────────────────────────────────────────────────────────

// POST /api/v1/auth/register
router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = validate(registerSchema, req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    // If master code provided, validate it (for free tier)
    if (body.masterCode) {
      const masterCode = await prisma.masterCode.findUnique({
        where: { code: body.masterCode },
      });
      if (!masterCode) {
        throw ApiError.badRequest('Invalid master code');
      }
      if (masterCode.revoked) {
        throw ApiError.badRequest('Master code has been revoked');
      }
      if (masterCode.expiresAt && new Date() > masterCode.expiresAt) {
        throw ApiError.badRequest('Master code has expired');
      }
      if (masterCode.usedCount >= masterCode.maxUses) {
        throw ApiError.badRequest('Master code has reached maximum uses');
      }
      // Increment usage
      await prisma.masterCode.update({
        where: { id: masterCode.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: body.role as 'TALENT' | 'CASTING_DIRECTOR' | 'CREATOR',
        profile: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Create free subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        tier: 'FREE',
        price: 0,
      },
    });

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile,
        },
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = validate(loginSchema, req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { profile: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isValidPassword = await comparePassword(body.password, user.passwordHash);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          profile: user.profile,
        },
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = validate(refreshSchema, req.body);

    const decoded = verifyRefreshToken(body.refreshToken) as TokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // In a stateless JWT system, logout is client-side (delete token)
    // For token revocation, you'd need a token blacklist (Redis, etc.)
    // For now, we just return success
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = validate(forgotPasswordSchema, req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent',
      });
      return;
    }

    // TODO: Generate reset token and send email
    // For now, mock the email sending
    console.log(`[MOCK EMAIL] Password reset requested for: ${body.email}`);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', authLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate input (throws if invalid)
    validate(resetPasswordSchema, req.body);

    // TODO: Validate reset token against stored token
    // For now, this is a placeholder implementation
    // In production, you'd verify a secure token from the database/Redis

    // Mock: Just return success
    // Real implementation would:
    // 1. Verify the reset token
    // 2. Find the user associated with the token
    // 3. Hash the new password
    // 4. Update the user's password
    // 5. Invalidate the reset token

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        profile: {
          include: {
            talentProfile: true,
            castingDirector: true,
          },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        profile: user.profile,
        subscription: user.subscriptions[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/auth/me
router.put('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const body = validate(updateProfileSchema, req.body);

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        profile: {
          update: {
            ...body,
          },
        },
      },
      include: {
        profile: {
          include: {
            talentProfile: true,
            castingDirector: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
