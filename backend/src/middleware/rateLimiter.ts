import rateLimit from 'express-rate-limit';
import { appConfig } from '../config';
import { ApiError } from '../utils/ApiError';

export const generalLimiter = rateLimit({
  windowMs: appConfig.rateLimitWindowMs,
  max: appConfig.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests('Too many requests, please try again later'));
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests('Too many authentication attempts, please try again later'));
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests('Rate limit exceeded'));
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

export default generalLimiter;
