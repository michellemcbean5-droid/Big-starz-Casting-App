import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

export interface CastingCallFilters {
  search?: string;
  type?: string;
  location?: string;
  remote?: boolean;
  budgetMin?: number;
  budgetMax?: number;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export async function listCastingCalls(filters: CastingCallFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.CastingCallWhereInput = {};

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.type) {
    where.type = filters.type as any;
  }

  if (filters.location) {
    where.location = { contains: filters.location, mode: 'insensitive' };
  }

  if (filters.remote !== undefined) {
    where.remoteOk = filters.remote;
  }

  const budgetFilter: { gte?: number; lte?: number } = {};
  if (filters.budgetMin !== undefined) budgetFilter.gte = filters.budgetMin;
  if (filters.budgetMax !== undefined) budgetFilter.lte = filters.budgetMax;
  if (Object.keys(budgetFilter).length > 0) {
    where.budget = budgetFilter as any;
  }

  if (filters.status) {
    where.status = filters.status as any;
  } else {
    where.status = { in: ['OPEN', 'FILLED'] as any };
  }

  let orderBy: Prisma.CastingCallOrderByWithRelationInput = { createdAt: 'desc' };

  if (filters.sort === 'oldest') {
    orderBy = { createdAt: 'asc' };
  } else if (filters.sort === 'budget_high') {
    orderBy = { budget: 'desc' };
  } else if (filters.sort === 'budget_low') {
    orderBy = { budget: 'asc' };
  } else if (filters.sort === 'deadline') {
    orderBy = { deadline: 'asc' };
  }

  const [castingCalls, total] = await Promise.all([
    prisma.castingCall.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        director: {
          select: {
            id: true,
            email: true,
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
    prisma.castingCall.count({ where }),
  ]);

  return {
    data: castingCalls,
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

export async function getCastingCallById(id: string) {
  const castingCall = await prisma.castingCall.findUnique({
    where: { id },
    include: {
      director: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              displayName: true,
              avatarUrl: true,
              location: true,
            },
          },
        },
      },
      applications: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          talent: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: { applications: true },
      },
    },
  });

  if (!castingCall) {
    throw ApiError.notFound('Casting call not found');
  }

  return castingCall;
}

export async function createCastingCall(data: any, directorId: string) {
  const castingCall = await prisma.castingCall.create({
    data: {
      ...data,
      directorId,
      status: data.status || 'DRAFT',
    },
    include: {
      director: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return castingCall;
}

export async function updateCastingCall(id: string, data: any, directorId: string) {
  const existing = await prisma.castingCall.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Casting call not found');
  }

  if (existing.directorId !== directorId) {
    throw ApiError.forbidden('You can only update your own casting calls');
  }

  const updated = await prisma.castingCall.update({
    where: { id },
    data,
    include: {
      director: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: { applications: true },
      },
    },
  });

  return updated;
}

export async function deleteCastingCall(id: string, directorId: string) {
  const existing = await prisma.castingCall.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Casting call not found');
  }

  if (existing.directorId !== directorId) {
    throw ApiError.forbidden('You can only delete your own casting calls');
  }

  await prisma.castingCall.delete({ where: { id } });

  return { id, deleted: true };
}

export async function getApplicationsForCastingCall(id: string, directorId: string) {
  const castingCall = await prisma.castingCall.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          talent: {
            select: {
              id: true,
              email: true,
              profile: {
                include: {
                  talentProfile: true,
                },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });

  if (!castingCall) {
    throw ApiError.notFound('Casting call not found');
  }

  if (castingCall.directorId !== directorId) {
    throw ApiError.forbidden('You can only view applications for your own casting calls');
  }

  return castingCall.applications;
}

export async function closeCastingCall(id: string, directorId: string) {
  const existing = await prisma.castingCall.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Casting call not found');
  }

  if (existing.directorId !== directorId) {
    throw ApiError.forbidden('You can only close your own casting calls');
  }

  const updated = await prisma.castingCall.update({
    where: { id },
    data: { status: 'CLOSED' },
  });

  return updated;
}

export async function fillCastingCall(id: string, directorId: string) {
  const existing = await prisma.castingCall.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Casting call not found');
  }

  if (existing.directorId !== directorId) {
    throw ApiError.forbidden('You can only fill your own casting calls');
  }

  const updated = await prisma.castingCall.update({
    where: { id },
    data: { status: 'FILLED' },
  });

  return updated;
}
