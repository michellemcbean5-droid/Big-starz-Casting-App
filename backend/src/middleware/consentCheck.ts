import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

export interface ConsentCheckRequest extends AuthenticatedRequest {
  consentSigned?: boolean;
}

/**
 * Middleware to check if the user has signed an AI consent agreement.
 * Required for digital twin generation and other AI features that require explicit consent.
 */
export async function consentCheckMiddleware(
  req: ConsentCheckRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    const contract = await prisma.contract.findFirst({
      where: {
        userId: req.user.userId,
        type: 'AI_CONSENT',
        status: 'SIGNED',
      },
      orderBy: { signedAt: 'desc' },
    });

    const consentSigned = !!contract;
    req.consentSigned = consentSigned;

    if (!consentSigned) {
      next(
        ApiError.forbidden(
          'AI consent agreement required. Please sign the AI consent agreement before using this feature.'
        )
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

export default consentCheckMiddleware;
