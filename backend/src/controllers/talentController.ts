import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import * as talentService from '../services/talentService';
import { validate, talentSearchSchema } from '../utils/validators';

export async function listTalentProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = validate(talentSearchSchema, {
      ...req.query,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      ageMin: req.query.ageMin ? parseInt(req.query.ageMin as string, 10) : undefined,
      ageMax: req.query.ageMax ? parseInt(req.query.ageMax as string, 10) : undefined,
      featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
      skills: req.query.skills ? (req.query.skills as string).split(',').map((s) => s.trim()) : undefined,
    });

    const result = await talentService.listTalentProfiles(filters);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTalentProfileById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const talentProfile = await talentService.getTalentProfileById(id);

    res.status(200).json({
      success: true,
      data: talentProfile,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDigitalTwinInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const digitalTwin = await talentService.getDigitalTwinInfo(id);

    res.status(200).json({
      success: true,
      data: digitalTwin,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRankingScore(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    if (req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('Admin access required');
    }

    const { id } = req.params;
    const { score } = req.body;

    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw ApiError.badRequest('Score must be a number between 0 and 100');
    }

    const talentProfile = await talentService.updateRankingScore(id, score);

    res.status(200).json({
      success: true,
      data: talentProfile,
    });
  } catch (error) {
    next(error);
  }
}
