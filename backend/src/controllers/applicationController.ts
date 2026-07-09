import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import * as applicationService from '../services/applicationService';
import {
  validate,
  applicationSubmitSchema,
  applicationStatusUpdateSchema,
} from '../utils/validators';

export async function submitApplication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const data = validate(applicationSubmitSchema, req.body);

    const application = await applicationService.submitApplication(data, req.user.userId);

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
}

export async function listApplications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const applications = await applicationService.listApplications(req.user.userId, req.user.role);

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
}

export async function getApplicationById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const application = await applicationService.getApplicationById(id, req.user.userId, req.user.role);

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateApplicationStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const { status } = validate(applicationStatusUpdateSchema, req.body);

    const application = await applicationService.updateApplicationStatus(id, status, req.user.userId);

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
}

export async function withdrawApplication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const result = await applicationService.withdrawApplication(id, req.user.userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
