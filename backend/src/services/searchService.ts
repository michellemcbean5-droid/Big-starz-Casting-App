import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export interface SearchFilters {
  query?: string;
  type?: 'casting' | 'talent';
  page?: number;
  limit?: number;
}

export async function unifiedSearch(filters: SearchFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  const query = filters.query || '';

  const results: {
    castingCalls: any[];
    talent: any[];
    totalCasting: number;
    totalTalent: number;
  } = {
    castingCalls: [],
    talent: [],
    totalCasting: 0,
    totalTalent: 0,
  };

  if (!filters.type || filters.type === 'casting') {
    const castingWhere: Prisma.CastingCallWhereInput = {
      status: { in: ['OPEN', 'FILLED'] as any },
    };

    if (query) {
      castingWhere.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [castingCalls, totalCasting] = await Promise.all([
      prisma.castingCall.findMany({
        where: castingWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          director: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.castingCall.count({ where: castingWhere }),
    ]);

    results.castingCalls = castingCalls;
    results.totalCasting = totalCasting;
  }

  if (!filters.type || filters.type === 'talent') {
    const talentWhere: Prisma.TalentProfileWhereInput = {};

    if (query) {
      talentWhere.OR = [
        { stageName: { contains: query, mode: 'insensitive' } },
        { profile: { firstName: { contains: query, mode: 'insensitive' } } },
        { profile: { lastName: { contains: query, mode: 'insensitive' } } },
        { profile: { bio: { contains: query, mode: 'insensitive' } } },
        { skills: { hasSome: [query] } },
      ];
    }

    const [talent, totalTalent] = await Promise.all([
      prisma.talentProfile.findMany({
        where: talentWhere,
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
      prisma.talentProfile.count({ where: talentWhere }),
    ]);

    results.talent = talent;
    results.totalTalent = totalTalent;
  }

  return {
    ...results,
    pagination: {
      page,
      limit,
      total: results.totalCasting + results.totalTalent,
      hasNext: page * limit < (results.totalCasting + results.totalTalent),
      hasPrev: page > 1,
    },
  };
}

export async function recommendCastingCalls(_userId: string) {
  const castingCalls = await prisma.castingCall.findMany({
    where: {
      status: 'OPEN',
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      director: {
        select: {
          id: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
        },
      },
      _count: {
        select: { applications: true },
      },
    },
  });

  return castingCalls;
}
