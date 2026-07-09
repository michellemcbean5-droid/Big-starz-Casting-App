import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import ContractService from '../services/contractService';
import { ContractType } from '@prisma/client';

// Validation schemas
const signContractSchema = Joi.object({
  ipAddress: Joi.string().ip().optional(),
  userAgent: Joi.string().optional(),
});

const generateContractSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

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

export class ContractController {
  /**
   * GET /api/v1/contracts
   * List my contracts
   */
  static async listContracts(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const contracts = await ContractService.listContracts(req.user.userId);

      res.status(200).json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/contracts/:id
   * Get contract detail
   */
  static async getContractById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { id } = req.params;
      const contract = await ContractService.getContractById(id, req.user.userId);

      res.status(200).json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/contracts/:id/sign
   * Sign a contract
   */
  static async signContract(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { id } = req.params;
      const body = validate(signContractSchema, req.body);
      const ipAddress = body.ipAddress || req.ip || 'unknown';
      const userAgent = body.userAgent || req.headers['user-agent'] || 'unknown';

      const contract = await ContractService.signContract(id, req.user.userId, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        data: contract,
        message: 'Contract signed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/contracts/types
   * List available contract types
   */
  static async listContractTypes(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const types = await ContractService.listContractTypes();

      res.status(200).json({
        success: true,
        data: types,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/contracts/:type/generate
   * Generate contract for user (admin only)
   */
  static async generateContract(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const { type } = req.params;
      const body = validate(generateContractSchema, req.body);

      const contractType = type as ContractType;
      const contract = await ContractService.generateContract(body.userId, contractType);

      res.status(201).json({
        success: true,
        data: contract,
        message: 'Contract generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ContractController;
