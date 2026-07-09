import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

export interface TalentFilters {
  search?: string;
  skills?: string[];
  location?: string;
  unionStatus?: string;
  ageMin?: number;
  ageMax?: number;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export async function listTalentProfiles(filters: TalentFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.TalentProfileWhereInput = {};

  if (filters.search) {
    where.OR = [
      { stageName: { contains: filters.search, mode: 'insensitive' } },
      { profile: { firstName: { contains: filters.search, mode: 'insensitive' } } },
      { profile: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      { profile: { bio: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  if (filters.skills && filters.skills.length > 0) {
    where.skills = { hasSome: filters.skills };
  }

  if (filters.location) {
    where.profile = {
      ...(where.profile as Prisma.ProfileWhereInput || {}),
      location: { contains: filters.location, mode: 'insensitive' },
    };
  }

  if (filters.unionStatus) {
    where.unionStatus = filters.unionStatus as any;
  }

  if (filters.featured !== undefined) {
    where.isFeatured = filters.featured;
  }

  if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
    const now = new Date();
    const minDateOfBirth = filters.ageMax !== undefined
      ? new Date(now.getFullYear() - filters.ageMax, now.getMonth(), now.getDate())
      : undefined;
    const maxDateOfBirth = filters.ageMin !== undefined
      ? new Date(now.getFullYear() - filters.ageMin, now.getMonth(), now.getDate())
      : undefined;

    if (minDateOfBirth || maxDateOfBirth) {
      where.profile = {
        ...(where.profile as Prisma.ProfileWhereInput || {}),
        dateOfBirth: {
          gte: minDateOfBirth,
          lte: maxDateOfBirth,
        },
      };
    }
  }

  const [talentProfiles, total] = await Promise.all([
    prisma.talentProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { rankingScore: 'desc' },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            location: true,
            userId: true,
          },
        },
      },
    }),
    prisma.talentProfile.count({ where }),
  ]);

  return {
    data: talentProfiles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

export async function getTalentProfileById(userId: string) {
  const talentProfile = await prisma.talentProfile.findFirst({
    where: {
      profile: {
        userId,
      },
    },
    include: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          location: true,
          phone: true,
          dateOfBirth: true,
          userId: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!talentProfile) {
    throw ApiError.notFound('Talent profile not found');
  }

  return talentProfile;
}

export async function getDigitalTwinInfo(userId: string) {
  const digitalTwin = await prisma.digitalTwin.findFirst({
    where: { talentId: userId },
    select: {
      id: true,
      name: true,
      description: true,
      thumbnailUrl: true,
      status: true,
      consentSigned: true,
      consentSignedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!digitalTwin) {
    throw ApiError.notFound('Digital twin not found for this talent');
  }

  return digitalTwin;
}

export async function updateRankingScore(profileId: string, score: number) {
  const talentProfile = await prisma.talentProfile.update({
    where: { id: profileId },
    data: { rankingScore: score },
    include: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
        },
      },
    },
  });

  return talentProfile;
}
