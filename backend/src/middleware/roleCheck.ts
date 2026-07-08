import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { ApiError } from '../utils/ApiError';

export function requireRoles(...allowedRoles: string[]) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden(`Required role: ${allowedRoles.join(' or ')}`));
      return;
    }

    next();
  };
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireRoles('ADMIN')(req, res, next);
}

export function requireTalent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireRoles('TALENT')(req, res, next);
}

export function requireCastingDirector(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireRoles('CASTING_DIRECTOR')(req, res, next);
}

export function requireCreator(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireRoles('CREATOR')(req, res, next);
}

export default requireRoles;
