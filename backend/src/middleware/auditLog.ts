import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from './auth';

/**
 * Audit log middleware
 * After each request, log: userId, action, entityType, entityId, metadata, ipAddress
 * Uses res.on('finish') to capture response status
 */
export function auditLogMiddleware(
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Use res.on('finish') to capture the final response status
  res.on('finish', async () => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId || null;
      const action = `${req.method} ${req.route?.path || req.path}`;
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';

      // Determine entityType from path segments
      const pathSegments = req.path.split('/').filter(Boolean);
      const entityType = pathSegments.length > 1 ? pathSegments[1] : 'unknown';

      // Extract entityId from params
      const entityId = req.params.id || req.params.userId || null;

      // Build metadata (exclude sensitive fields)
      const metadata: Record<string, unknown> = {
        statusCode: res.statusCode,
        query: req.query,
      };

      // Only include body fields that are not sensitive
      if (req.body && typeof req.body === 'object') {
        const safeBody = { ...req.body };
        // Remove sensitive fields
        delete safeBody.password;
        delete safeBody.passwordHash;
        delete safeBody.token;
        delete safeBody.digitalSignature;
        if (Object.keys(safeBody).length > 0) {
          metadata.body = safeBody;
        }
      }

      // Don't log audit endpoints to avoid infinite loops
      if (req.path.includes('/api/v1/audit')) {
        return;
      }

      // Fire-and-forget audit log creation (don't block response)
      prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          metadata,
          ipAddress,
        },
      }).catch((err) => {
        // Silently log errors to avoid affecting the response
        console.error('[AuditLog] Failed to create audit log:', err);
      });
    } catch (error) {
      console.error('[AuditLog] Error in audit middleware:', error);
    }
  });

  next();
}

export default auditLogMiddleware;
