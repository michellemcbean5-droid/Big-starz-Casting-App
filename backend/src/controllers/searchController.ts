import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import * as searchService from '../services/searchService';
import * as matchingService from '../services/matchingService';
import { validate, matchRequestSchema } from '../utils/validators';

export async function unifiedSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const type = req.query.type as string | undefined;
    const query = req.query.query as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await searchService.unifiedSearch({
      query,
      type: type as 'casting' | 'talent' | undefined,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function autoMatch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const data = validate(matchRequestSchema, req.body);

    let matches;

    if (data.castingCallId) {
      matches = await matchingService.matchTalentToCastingCall(data.castingCallId, data.limit);
    } else if (data.talentProfileId) {
      matches = await matchingService.matchCastingCallToTalent(data.talentProfileId, data.limit);
    } else {
      throw ApiError.badRequest('Either castingCallId or talentProfileId must be provided');
    }

    res.status(200).json({
      success: true,
      data: matches,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecommendations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    if (req.user.role !== 'TALENT') {
      throw ApiError.forbidden('This endpoint is for talent users only');
    }

    const castingCalls = await searchService.recommendCastingCalls(req.user.userId);

    const talentProfile = await matchingService.findTalentProfileByUserId(req.user.userId);

    let scoredRecommendations = castingCalls;

    if (talentProfile) {
      scoredRecommendations = castingCalls
        .map((castingCall) => {
          const { score, breakdown, explanation } = matchingService.scoreMatch(talentProfile, castingCall);
          return {
            ...castingCall,
            matchScore: score,
            matchBreakdown: breakdown,
            matchExplanation: explanation,
          };
        })
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    res.status(200).json({
      success: true,
      data: scoredRecommendations,
    });
  } catch (error) {
    next(error);
  }
}
