import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import * as castingService from '../services/castingService';
import {
  validate,
  castingCallCreateSchema,
  castingCallUpdateSchema,
  castingCallSearchSchema,
} from '../utils/validators';

export async function listCastingCalls(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = validate(castingCallSearchSchema, {
      ...req.query,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      budget_min: req.query.budget_min ? parseFloat(req.query.budget_min as string) : undefined,
      budget_max: req.query.budget_max ? parseFloat(req.query.budget_max as string) : undefined,
      remote: req.query.remote === 'true' ? true : req.query.remote === 'false' ? false : undefined,
    });

    const result = await castingService.listCastingCalls(filters);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCastingCallById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const castingCall = await castingService.getCastingCallById(id);

    res.status(200).json({
      success: true,
      data: castingCall,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCastingCall(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const data = validate(castingCallCreateSchema, req.body);

    const castingCall = await castingService.createCastingCall(data, req.user.userId);

    res.status(201).json({
      success: true,
      data: castingCall,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCastingCall(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const data = validate(castingCallUpdateSchema, req.body);

    const castingCall = await castingService.updateCastingCall(id, data, req.user.userId);

    res.status(200).json({
      success: true,
      data: castingCall,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCastingCall(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const result = await castingService.deleteCastingCall(id, req.user.userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getApplicationsForCastingCall(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const applications = await castingService.getApplicationsForCastingCall(id, req.user.userId);

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
}

export async function closeCastingCall(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const castingCall = await castingService.closeCastingCall(id, req.user.userId);

    res.status(200).json({
      success: true,
      data: castingCall,
    });
  } catch (error) {
    next(error);
  }
}

export async function fillCastingCall(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const castingCall = await castingService.fillCastingCall(id, req.user.userId);

    res.status(200).json({
      success: true,
      data: castingCall,
    });
  } catch (error) {
    next(error);
  }
}
